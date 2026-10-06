import { insertSecurityAudit } from "@/server/audit/mysql";
import { withRuntimeDatabase } from "@/server/db/runtime";
import {
  type MediaAsset,
  type MediaUploadIntent,
  type MediaUploadRepository,
} from "@/server/media/service";
import type { AllowedMediaMimeType } from "@/server/media/validation";

type Row = Record<string, unknown>;

function rows(result: unknown) {
  return Array.isArray(result) ? (result as Row[]) : [];
}

function date(value: unknown) {
  return value instanceof Date ? value : new Date(String(value));
}

function intentFromRow(row: Row): MediaUploadIntent {
  return {
    id: String(row.id),
    adminId: Number(row.admin_id),
    objectKey: String(row.object_key),
    mimeType: String(row.mime_type) as AllowedMediaMimeType,
    maxByteSize: Number(row.max_byte_size),
    expectedSha256: String(row.expected_sha256).toLowerCase(),
    nonceHash:
      Buffer.isBuffer(row.nonce_hash)
        ? row.nonce_hash.toString("hex")
        : String(row.nonce_hash).toLowerCase(),
    expiresAt: date(row.expires_at),
    consumedAt: row.consumed_at ? date(row.consumed_at) : null,
    mediaAssetId:
      row.media_asset_id === null || row.media_asset_id === undefined
        ? null
        : Number(row.media_asset_id),
    confirmationTokenHash:
      row.confirmation_token_hash === null ||
      row.confirmation_token_hash === undefined
        ? null
        : Buffer.isBuffer(row.confirmation_token_hash)
          ? row.confirmation_token_hash.toString("hex")
          : String(row.confirmation_token_hash).toLowerCase(),
    confirmationExpiresAt: row.confirmation_expires_at
      ? date(row.confirmation_expires_at)
      : null,
    createdAt: date(row.created_at),
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
    publicUsageConfirmedAt: row.public_usage_confirmed_at
      ? date(row.public_usage_confirmed_at)
      : null,
    publicUsageConfirmedBy:
      row.public_usage_confirmed_by === null ||
      row.public_usage_confirmed_by === undefined
        ? null
        : Number(row.public_usage_confirmed_by),
    createdBy: Number(row.created_by),
    createdAt: date(row.created_at),
  };
}

export class MySqlMediaUploadRepository implements MediaUploadRepository {
  async findById(id: number) {
    return withRuntimeDatabase(async (connection) => {
      const [result] = await connection.query(
        `SELECT id, object_key, mime_type, byte_size, checksum_sha256, width_px, height_px,
                public_usage_confirmed_at, public_usage_confirmed_by, created_by, created_at
           FROM media_assets WHERE id = ? LIMIT 1`, [id],
      );
      const row = rows(result)[0];
      return row ? assetFromRow(row) : null;
    });
  }

  async createIntent(intent: MediaUploadIntent, requestId = "media-presign") {
    return withRuntimeDatabase(async (connection) => {
      await connection.beginTransaction();
      try {
        await connection.query(
          `INSERT INTO media_upload_intents
            (id, admin_id, object_key, mime_type, max_byte_size,
             expected_sha256, nonce_hash, expires_at, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            intent.id,
            intent.adminId,
            intent.objectKey,
            intent.mimeType,
            intent.maxByteSize,
            intent.expectedSha256,
            Buffer.from(intent.nonceHash, "hex"),
            intent.expiresAt,
            intent.createdAt,
          ],
        );
        await insertSecurityAudit(connection, {
          action: "media_presigned",
          actorAdminId: intent.adminId,
          requestId,
          metadata: {
            intentId: intent.id,
            mimeType: intent.mimeType,
            maxByteSize: intent.maxByteSize,
            expiresAt: intent.expiresAt.toISOString(),
          },
        });
        await connection.commit();
        return intent;
      } catch (error) {
        await connection.rollback();
        throw error;
      }
    });
  }

  async claimIntent({
    intentId,
    adminId,
    confirmationTokenHash,
    now,
    leaseExpiresAt,
  }: {
    intentId: string;
    adminId: number;
    confirmationTokenHash: string;
    now: Date;
    leaseExpiresAt: Date;
  }) {
    return withRuntimeDatabase(async (connection) => {
      await connection.beginTransaction();
      try {
        const [result] = await connection.query(
          `SELECT id, admin_id, object_key, mime_type, max_byte_size,
                  expected_sha256, nonce_hash, expires_at, consumed_at,
                  media_asset_id, confirmation_token_hash,
                  confirmation_expires_at, created_at
             FROM media_upload_intents
            WHERE id = ?
            FOR UPDATE`,
          [intentId],
        );
        const row = rows(result)[0];
        if (!row) throw new Error("Upload intent not found.");
        const intent = intentFromRow(row);
        if (intent.adminId !== adminId) {
          throw new Error("Upload intent owner does not match the administrator.");
        }
        if (intent.mediaAssetId !== null) {
          const [assetResult] = await connection.query(
            `SELECT id, object_key, mime_type, byte_size,
                    checksum_sha256, width_px, height_px,
                    public_usage_confirmed_at, public_usage_confirmed_by,
                    created_by, created_at
               FROM media_assets
              WHERE id = ?`,
            [intent.mediaAssetId],
          );
          const asset = rows(assetResult)[0];
          if (!asset) {
            throw new Error("Consumed upload intent has no media asset.");
          }
          await connection.commit();
          return {
            status: "confirmed" as const,
            asset: assetFromRow(asset),
          };
        }
        if (intent.consumedAt !== null) {
          throw new Error("Upload intent has already been consumed.");
        }
        if (now >= intent.expiresAt) {
          throw new Error("Upload intent has expired.");
        }
        if (
          intent.confirmationTokenHash !== null &&
          intent.confirmationExpiresAt !== null &&
          intent.confirmationExpiresAt > now
        ) {
          await connection.commit();
          return { status: "in_progress" as const };
        }
        if (leaseExpiresAt <= now) {
          throw new Error("Upload confirmation lease is invalid.");
        }
        await connection.query(
          `UPDATE media_upload_intents
              SET confirmation_token_hash = ?,
                  confirmation_expires_at = ?
            WHERE id = ?`,
          [
            Buffer.from(confirmationTokenHash, "hex"),
            leaseExpiresAt,
            intentId,
          ],
        );
        await connection.commit();
        return {
          status: "claimed" as const,
          intent: {
            ...intent,
            confirmationTokenHash,
            confirmationExpiresAt: leaseExpiresAt,
          },
        };
      } catch (error) {
        await connection.rollback();
        throw error;
      }
    });
  }

  async releaseIntentClaim(
    intentId: string,
    confirmationTokenHash: string,
  ) {
    await withRuntimeDatabase(async (connection) => {
      await connection.query(
        `UPDATE media_upload_intents
            SET confirmation_token_hash = NULL,
                confirmation_expires_at = NULL
          WHERE id = ?
            AND confirmation_token_hash = ?
            AND consumed_at IS NULL`,
        [intentId, Buffer.from(confirmationTokenHash, "hex")],
      );
    });
  }

  async consumeIntent(
    intentId: string,
    confirmationTokenHash: string,
    asset: Omit<MediaAsset, "id">,
    consumedAt: Date,
    requestId = "media-confirm",
  ) {
    return withRuntimeDatabase(async (connection) => {
      await connection.beginTransaction();
      try {
        const [intentResult] = await connection.query(
          `SELECT admin_id, consumed_at, media_asset_id,
                  confirmation_token_hash, confirmation_expires_at
             FROM media_upload_intents
            WHERE id = ?
            FOR UPDATE`,
          [intentId],
        );
        const intent = rows(intentResult)[0];
        if (!intent) throw new Error("Upload intent not found.");
        if (intent.media_asset_id) {
          const [assetResult] = await connection.query(
            `SELECT id, object_key, mime_type, byte_size,
                    checksum_sha256, width_px, height_px,
                    public_usage_confirmed_at, public_usage_confirmed_by,
                    created_by, created_at
               FROM media_assets
              WHERE id = ?`,
            [Number(intent.media_asset_id)],
          );
          const existing = rows(assetResult)[0];
          if (!existing) throw new Error("Confirmed media asset is missing.");
          await connection.commit();
          return assetFromRow(existing);
        }
        if (Number(intent.admin_id) !== asset.createdBy) {
          throw new Error("Upload intent owner changed before confirmation.");
        }
        const storedConfirmationTokenHash = Buffer.isBuffer(
          intent.confirmation_token_hash,
        )
          ? intent.confirmation_token_hash
          : null;
        const confirmationExpiresAt = date(intent.confirmation_expires_at);
        if (
          !storedConfirmationTokenHash ||
          !storedConfirmationTokenHash.equals(
            Buffer.from(confirmationTokenHash, "hex"),
          ) ||
          confirmationExpiresAt === null ||
          confirmationExpiresAt <= consumedAt
        ) {
          throw new Error("Upload confirmation claim is no longer valid.");
        }

        const [insertResult] = await connection.query(
          `INSERT INTO media_assets
            (object_key, mime_type, byte_size, checksum_sha256,
             width_px, height_px, created_by, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            asset.objectKey,
            asset.mimeType,
            asset.byteSize,
            asset.checksumSha256,
            asset.width,
            asset.height,
            asset.createdBy,
            asset.createdAt,
          ],
        );
        const mediaAssetId = Number(
          (insertResult as { insertId?: number }).insertId,
        );
        if (!mediaAssetId) throw new Error("Media asset insert did not return an id.");
        const [updateResult] = await connection.query(
          `UPDATE media_upload_intents
              SET consumed_at = ?, media_asset_id = ?,
                  confirmation_token_hash = NULL,
                  confirmation_expires_at = NULL
            WHERE id = ?
              AND consumed_at IS NULL
              AND confirmation_token_hash = ?`,
          [
            consumedAt,
            mediaAssetId,
            intentId,
            Buffer.from(confirmationTokenHash, "hex"),
          ],
        );
        if (Number((updateResult as { affectedRows?: number }).affectedRows) !== 1) {
          throw new Error("Upload confirmation claim changed before consumption.");
        }
        await insertSecurityAudit(connection, {
          action: "media_confirmed",
          actorAdminId: asset.createdBy,
          requestId,
          metadata: {
            intentId,
            mediaAssetId,
            mimeType: asset.mimeType,
            byteSize: asset.byteSize,
            checksumPrefix: asset.checksumSha256.slice(0, 12),
          },
        });
        await connection.commit();
        return { id: mediaAssetId, ...asset };
      } catch (error) {
        await connection.rollback();
        throw error;
      }
    });
  }

  async recordCleanupDeferred(
    intentId: string,
    adminId: number,
    requestId = "media-confirm",
  ) {
    await withRuntimeDatabase((connection) =>
      insertSecurityAudit(connection, {
        action: "media_cleanup_deferred",
        actorAdminId: adminId,
        requestId,
        metadata: {
          intentId,
          reasonCode: "staging_cleanup_failed",
        },
      }),
    );
  }

  async confirmPublicUsage({
    mediaAssetId,
    adminId,
    confirmedAt,
    requestId,
  }: Parameters<MediaUploadRepository["confirmPublicUsage"]>[0]) {
    return withRuntimeDatabase(async (connection) => {
      await connection.beginTransaction();
      try {
        const [result] = await connection.query(
          `SELECT id, object_key, mime_type, byte_size, checksum_sha256,
                  width_px, height_px, public_usage_confirmed_at,
                  public_usage_confirmed_by, created_by, created_at
             FROM media_assets
            WHERE id = ?
            FOR UPDATE`,
          [mediaAssetId],
        );
        const row = rows(result)[0];
        if (!row) throw new Error("Media asset not found.");
        if (!Number(row.width_px) || !Number(row.height_px)) {
          throw new Error("Media asset dimensions are not confirmed.");
        }
        if (!row.public_usage_confirmed_at) {
          await connection.query(
            `UPDATE media_assets
                SET public_usage_confirmed_at = ?, public_usage_confirmed_by = ?
              WHERE id = ? AND public_usage_confirmed_at IS NULL`,
            [confirmedAt, adminId, mediaAssetId],
          );
          await insertSecurityAudit(connection, {
            action: "media_public_usage_confirmed",
            actorAdminId: adminId,
            requestId,
            metadata: {
              mediaAssetId,
              reasonCode: "editor_confirmed_public_use_v1",
            },
          });
        }
        const [confirmedResult] = await connection.query(
          `SELECT id, object_key, mime_type, byte_size, checksum_sha256,
                  width_px, height_px, public_usage_confirmed_at,
                  public_usage_confirmed_by, created_by, created_at
             FROM media_assets WHERE id = ? LIMIT 1`,
          [mediaAssetId],
        );
        await connection.commit();
        return assetFromRow(rows(confirmedResult)[0]);
      } catch (error) {
        await connection.rollback();
        throw error;
      }
    });
  }
}
