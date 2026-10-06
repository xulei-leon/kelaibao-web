import { insertSqliteSecurityAudit } from "@/server/audit/sqlite";
import {
  getRuntimeSqlite,
  sqliteDate,
  withSqliteWriteTransaction,
  type LocalSqliteDatabase,
} from "@/server/db/sqlite/runtime";
import type {
  MediaAsset,
  MediaUploadIntent,
  MediaUploadRepository,
} from "@/server/media/service";
import type { AllowedMediaMimeType } from "@/server/media/validation";

type Row = Record<string, null | number | string | Uint8Array>;

function intentFromRow(row: Row): MediaUploadIntent {
  return {
    id: String(row.id),
    adminId: Number(row.admin_id),
    objectKey: String(row.object_key),
    mimeType: String(row.mime_type) as AllowedMediaMimeType,
    maxByteSize: Number(row.max_byte_size),
    expectedSha256: String(row.expected_sha256).toLowerCase(),
    nonceHash: String(row.nonce_hash).toLowerCase(),
    expiresAt: sqliteDate(row.expires_at) ?? new Date(0),
    consumedAt: sqliteDate(row.consumed_at),
    mediaAssetId: row.media_asset_id === null ? null : Number(row.media_asset_id),
    confirmationTokenHash:
      row.confirmation_token_hash === null ? null : String(row.confirmation_token_hash),
    confirmationExpiresAt: sqliteDate(row.confirmation_expires_at),
    createdAt: sqliteDate(row.created_at) ?? new Date(0),
  };
}

function assetFromRow(row: Row): MediaAsset {
  return {
    id: Number(row.id),
    objectKey: String(row.object_key),
    mimeType: String(row.mime_type) as AllowedMediaMimeType,
    byteSize: Number(row.byte_size),
    checksumSha256: String(row.checksum_sha256).toLowerCase(),
    width: Number(row.width_px),
    height: Number(row.height_px),
    publicUsageConfirmedAt: sqliteDate(row.public_usage_confirmed_at),
    publicUsageConfirmedBy:
      row.public_usage_confirmed_by === null
        ? null
        : Number(row.public_usage_confirmed_by),
    createdBy: Number(row.created_by),
    createdAt: sqliteDate(row.created_at) ?? new Date(0),
  };
}

const INTENT_COLUMNS = `
  id, admin_id, object_key, mime_type, max_byte_size, expected_sha256,
  nonce_hash, expires_at, consumed_at, media_asset_id,
  confirmation_token_hash, confirmation_expires_at, created_at
`;

const ASSET_COLUMNS = `
  id, object_key, mime_type, byte_size, checksum_sha256, width_px, height_px,
  public_usage_confirmed_at, public_usage_confirmed_by, created_by, created_at
`;

export class SqliteMediaUploadRepository implements MediaUploadRepository {
  private readonly path: string;
  private readonly database: LocalSqliteDatabase;

  constructor(runtime = getRuntimeSqlite()) {
    this.path = runtime.path;
    this.database = runtime.database;
  }

  async findById(id: number) {
    const row = this.database.prepare(`SELECT ${ASSET_COLUMNS} FROM media_assets WHERE id = ? LIMIT 1`).get(id) as Row | undefined;
    return row ? assetFromRow(row) : null;
  }

  async createIntent(intent: MediaUploadIntent, requestId = "media-presign") {
    return withSqliteWriteTransaction(this.path, this.database, async () => {
      this.database.prepare(
        `INSERT INTO media_upload_intents
          (id, admin_id, object_key, mime_type, max_byte_size, expected_sha256,
           nonce_hash, expires_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        intent.id, intent.adminId, intent.objectKey, intent.mimeType,
        intent.maxByteSize, intent.expectedSha256, intent.nonceHash,
        intent.expiresAt.toISOString(), intent.createdAt.toISOString(),
      );
      insertSqliteSecurityAudit(this.database, {
        action: "media_presigned", actorAdminId: intent.adminId, requestId,
        metadata: {
          intentId: intent.id, mimeType: intent.mimeType,
          maxByteSize: intent.maxByteSize, expiresAt: intent.expiresAt.toISOString(),
        },
      }, intent.createdAt);
      return intent;
    });
  }

  async claimIntent({ intentId, adminId, confirmationTokenHash, now, leaseExpiresAt }:
    Parameters<MediaUploadRepository["claimIntent"]>[0]) {
    return withSqliteWriteTransaction(this.path, this.database, async () => {
      const row = this.database.prepare(
        `SELECT ${INTENT_COLUMNS} FROM media_upload_intents WHERE id = ? LIMIT 1`,
      ).get(intentId);
      if (!row) throw new Error("Upload intent not found.");
      const intent = intentFromRow(row);
      if (intent.adminId !== adminId) {
        throw new Error("Upload intent owner does not match the administrator.");
      }
      if (intent.mediaAssetId !== null) {
        const asset = this.database.prepare(
          `SELECT ${ASSET_COLUMNS} FROM media_assets WHERE id = ? LIMIT 1`,
        ).get(intent.mediaAssetId);
        if (!asset) throw new Error("Consumed upload intent has no media asset.");
        return { status: "confirmed" as const, asset: assetFromRow(asset) };
      }
      if (intent.consumedAt !== null) throw new Error("Upload intent has already been consumed.");
      if (now >= intent.expiresAt) throw new Error("Upload intent has expired.");
      if (
        intent.confirmationTokenHash !== null &&
        intent.confirmationExpiresAt !== null &&
        intent.confirmationExpiresAt > now
      ) {
        return { status: "in_progress" as const };
      }
      if (leaseExpiresAt <= now) throw new Error("Upload confirmation lease is invalid.");
      this.database.prepare(
        `UPDATE media_upload_intents
            SET confirmation_token_hash = ?, confirmation_expires_at = ?
          WHERE id = ?`,
      ).run(confirmationTokenHash, leaseExpiresAt.toISOString(), intentId);
      return {
        status: "claimed" as const,
        intent: { ...intent, confirmationTokenHash, confirmationExpiresAt: leaseExpiresAt },
      };
    });
  }

  async releaseIntentClaim(intentId: string, confirmationTokenHash: string) {
    await withSqliteWriteTransaction(this.path, this.database, async () => {
      this.database.prepare(
        `UPDATE media_upload_intents
            SET confirmation_token_hash = NULL, confirmation_expires_at = NULL
          WHERE id = ? AND confirmation_token_hash = ? AND consumed_at IS NULL`,
      ).run(intentId, confirmationTokenHash);
    });
  }

  async consumeIntent(
    intentId: string,
    confirmationTokenHash: string,
    asset: Omit<MediaAsset, "id">,
    consumedAt: Date,
    requestId = "media-confirm",
  ) {
    return withSqliteWriteTransaction(this.path, this.database, async () => {
      const intent = this.database.prepare(
        `SELECT ${INTENT_COLUMNS} FROM media_upload_intents WHERE id = ? LIMIT 1`,
      ).get(intentId);
      if (!intent) throw new Error("Upload intent not found.");
      const parsed = intentFromRow(intent);
      if (parsed.mediaAssetId !== null) {
        const existing = this.database.prepare(
          `SELECT ${ASSET_COLUMNS} FROM media_assets WHERE id = ? LIMIT 1`,
        ).get(parsed.mediaAssetId);
        if (!existing) throw new Error("Confirmed media asset is missing.");
        return assetFromRow(existing);
      }
      if (parsed.adminId !== asset.createdBy) {
        throw new Error("Upload intent owner changed before confirmation.");
      }
      if (
        parsed.confirmationTokenHash !== confirmationTokenHash ||
        parsed.confirmationExpiresAt === null ||
        parsed.confirmationExpiresAt <= consumedAt
      ) {
        throw new Error("Upload confirmation claim is no longer valid.");
      }
      const inserted = this.database.prepare(
        `INSERT INTO media_assets
          (object_key, mime_type, byte_size, checksum_sha256,
           width_px, height_px, created_by, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        asset.objectKey, asset.mimeType, asset.byteSize, asset.checksumSha256,
        asset.width, asset.height, asset.createdBy, asset.createdAt.toISOString(),
      );
      const mediaAssetId = Number(inserted.lastInsertRowid);
      const updated = this.database.prepare(
        `UPDATE media_upload_intents
            SET consumed_at = ?, media_asset_id = ?,
                confirmation_token_hash = NULL, confirmation_expires_at = NULL
          WHERE id = ? AND consumed_at IS NULL AND confirmation_token_hash = ?`,
      ).run(consumedAt.toISOString(), mediaAssetId, intentId, confirmationTokenHash);
      if (updated.changes !== 1) {
        throw new Error("Upload confirmation claim changed before consumption.");
      }
      insertSqliteSecurityAudit(this.database, {
        action: "media_confirmed", actorAdminId: asset.createdBy, requestId,
        metadata: {
          intentId, mediaAssetId, mimeType: asset.mimeType,
          byteSize: asset.byteSize, checksumPrefix: asset.checksumSha256.slice(0, 12),
        },
      }, consumedAt);
      return { id: mediaAssetId, ...asset };
    });
  }

  async recordCleanupDeferred(
    intentId: string,
    adminId: number,
    requestId = "media-confirm",
  ) {
    await withSqliteWriteTransaction(this.path, this.database, async () => {
      insertSqliteSecurityAudit(this.database, {
        action: "media_cleanup_deferred", actorAdminId: adminId, requestId,
        metadata: { intentId, reasonCode: "staging_cleanup_failed" },
      });
    });
  }

  async confirmPublicUsage({
    mediaAssetId,
    adminId,
    confirmedAt,
    requestId,
  }: Parameters<MediaUploadRepository["confirmPublicUsage"]>[0]) {
    return withSqliteWriteTransaction(this.path, this.database, async () => {
      const row = this.database.prepare(
        `SELECT ${ASSET_COLUMNS} FROM media_assets WHERE id = ? LIMIT 1`,
      ).get(mediaAssetId);
      if (!row) throw new Error("Media asset not found.");
      if (!Number(row.width_px) || !Number(row.height_px)) {
        throw new Error("Media asset dimensions are not confirmed.");
      }
      if (row.public_usage_confirmed_at === null) {
        this.database.prepare(
          `UPDATE media_assets
              SET public_usage_confirmed_at = ?, public_usage_confirmed_by = ?
            WHERE id = ? AND public_usage_confirmed_at IS NULL`,
        ).run(confirmedAt.toISOString(), adminId, mediaAssetId);
        insertSqliteSecurityAudit(this.database, {
          action: "media_public_usage_confirmed",
          actorAdminId: adminId,
          requestId,
          metadata: {
            mediaAssetId,
            reasonCode: "editor_confirmed_public_use_v1",
          },
        }, confirmedAt);
      }
      const confirmed = this.database.prepare(
        `SELECT ${ASSET_COLUMNS} FROM media_assets WHERE id = ? LIMIT 1`,
      ).get(mediaAssetId);
      if (!confirmed) throw new Error("Media asset not found.");
      return assetFromRow(confirmed);
    });
  }
}
