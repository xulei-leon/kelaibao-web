import { createHash } from "node:crypto";

import { insertSqliteSecurityAudit } from "@/server/audit/sqlite";
import { confirmedMediaObjectKeys } from "@/server/content/confirmed-media";
import type {
  ContentActionPlan,
  ContentDraftFields,
  ContentItemState,
  ContentRevisionSnapshot,
  ContentType,
} from "@/server/content/domain";
import type { PublicContentSnapshot } from "@/server/content/public-contract";
import { buildContentPurgeUrls } from "@/server/content/purge";
import type {
  ContentMutationContext,
  ContentRepository,
} from "@/server/content/service";
import {
  getRuntimeSqlite,
  sqliteDate,
  sqliteIso,
  withSqliteWriteTransaction,
  type LocalSqliteDatabase,
} from "@/server/db/sqlite/runtime";

type Row = Record<string, null | number | string | Uint8Array>;
type PublicCoverMimeType = NonNullable<
  PublicContentSnapshot["coverImage"]
>["mimeType"];

function itemFromRow(row: Row): ContentItemState {
  return {
    id: Number(row.id),
    contentType: String(row.content_type) as ContentType,
    publicStatus: String(row.status) as ContentItemState["publicStatus"],
    slug: String(row.slug),
    title: String(row.title),
    summary: String(row.summary),
    sourceHtml: String(row.source_html),
    sanitizedHtml: String(row.sanitized_html),
    sanitizerPolicyVersion: String(row.sanitizer_policy_version),
    coverMediaAssetId: null,
    coverAlt: null,
    version: Number(row.version),
    draftRevisionId: row.draft_revision_id === null ? null : Number(row.draft_revision_id),
    publishedRevisionId:
      row.published_revision_id === null ? null : Number(row.published_revision_id),
    firstPublishedAt: sqliteDate(row.first_published_at),
    publishedAt: sqliteDate(row.published_at),
    offlineAt: sqliteDate(row.offline_at),
    caseAuthorizationConfirmedAt: sqliteDate(row.case_authorization_confirmed_at),
    caseAuthorizationAdminId:
      row.case_authorization_admin_id === null
        ? null
        : Number(row.case_authorization_admin_id),
    caseAuthorizationRevisionId:
      row.case_authorization_revision_id === null
        ? null
        : Number(row.case_authorization_revision_id),
  };
}

function revisionFromRow(row: Row, contentType: ContentType): ContentRevisionSnapshot {
  return {
    id: Number(row.id),
    contentItemId: Number(row.content_item_id),
    revisionNumber: Number(row.revision_number),
    contentType,
    slug: String(row.slug),
    title: String(row.title),
    summary: String(row.summary),
    sourceHtml: String(row.source_html),
    sanitizedHtml: String(row.sanitized_html),
    sanitizerPolicyVersion: String(row.sanitizer_policy_version),
    coverMediaAssetId:
      row.cover_media_asset_id === null || row.cover_media_asset_id === undefined
        ? null
        : Number(row.cover_media_asset_id),
    coverAlt:
      row.cover_alt === null || row.cover_alt === undefined
        ? null
        : String(row.cover_alt),
    status: String(row.status) as ContentRevisionSnapshot["status"],
    actorAdminId: Number(row.actor_admin_id),
    createdAt: sqliteDate(row.created_at) ?? new Date(0),
  };
}

const ITEM_COLUMNS = `
  id, content_type, status, slug, title, summary, source_html,
  sanitized_html, sanitizer_policy_version, version,
  draft_revision_id, published_revision_id,
  first_published_at, published_at, offline_at,
  case_authorization_confirmed_at, case_authorization_admin_id,
  case_authorization_revision_id
`;

const REVISION_COLUMNS = `
  id, content_item_id, revision_number, slug, title, summary,
  source_html, sanitized_html, sanitizer_policy_version,
  status, cover_media_asset_id, cover_alt, actor_admin_id, created_at
`;

function loadRevision(
  database: LocalSqliteDatabase,
  id: number | null,
  contentType: ContentType,
) {
  if (id === null) return null;
  const row = database
    .prepare(`SELECT ${REVISION_COLUMNS} FROM content_revisions WHERE id = ? LIMIT 1`)
    .get(id);
  if (!row) throw new Error("content_revision_missing");
  return revisionFromRow(row, contentType);
}

function insertRevision(
  database: LocalSqliteDatabase,
  itemId: number,
  revision: Omit<ContentRevisionSnapshot, "id" | "contentItemId">,
) {
  const result = database
    .prepare(
      `INSERT INTO content_revisions
        (content_item_id, revision_number, slug, title, summary, source_html,
         sanitized_html, sanitizer_policy_version, status, cover_media_asset_id,
         cover_alt, actor_admin_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      itemId,
      revision.revisionNumber,
      revision.slug,
      revision.title,
      revision.summary,
      revision.sourceHtml,
      revision.sanitizedHtml,
      revision.sanitizerPolicyVersion,
      revision.status,
      revision.coverMediaAssetId,
      revision.coverAlt,
      revision.actorAdminId,
      revision.createdAt.toISOString(),
    );
  const id = Number(result.lastInsertRowid);
  if (!id) throw new Error("content_revision_insert_failed");
  return id;
}

function assertConfirmedMedia(database: LocalSqliteDatabase, html: string) {
  const keys = confirmedMediaObjectKeys(html);
  if (!keys.length) return;
  const statement = database.prepare(
    `SELECT object_key FROM media_assets WHERE object_key IN (${keys.map(() => "?").join(",")})`,
  );
  const confirmed = new Set(statement.all(...keys).map((row) => String(row.object_key)));
  if (keys.some((key) => !confirmed.has(key))) {
    throw new Error("Content references an unconfirmed media object.");
  }
}

function assertCoverMedia(
  database: LocalSqliteDatabase,
  revision: Pick<ContentDraftFields, "coverMediaAssetId" | "coverAlt">,
) {
  if (revision.coverMediaAssetId === null && revision.coverAlt === null) return;
  if (revision.coverMediaAssetId === null || revision.coverAlt === null) {
    throw new Error("Cover media asset and cover alt must be provided together.");
  }
  const media = database.prepare(
    `SELECT id, mime_type, byte_size, width_px, height_px,
            public_usage_confirmed_at
       FROM media_assets
      WHERE id = ?
      LIMIT 1`,
  ).get(revision.coverMediaAssetId);
  const width = Number(media?.width_px);
  const height = Number(media?.height_px);
  const ratio = width / height;
  if (
    !media ||
    !media.public_usage_confirmed_at ||
    !["image/jpeg", "image/png", "image/webp"].includes(String(media.mime_type)) ||
    Number(media.byte_size) > 350 * 1024 ||
    width < 1200 ||
    height < 630 ||
    Math.abs(ratio - 1200 / 630) > 0.08
  ) {
    throw new Error("Cover media asset is not confirmed for public representative use.");
  }
}

function publicCoverMimeType(value: unknown): PublicCoverMimeType {
  if (
    value !== "image/jpeg" &&
    value !== "image/png" &&
    value !== "image/webp"
  ) {
    throw new Error("published_cover_mime_type_invalid");
  }
  return value;
}

function publicCoverImage(
  database: LocalSqliteDatabase,
  revision: Row,
): PublicContentSnapshot["coverImage"] {
  const coverMediaAssetId =
    revision.cover_media_asset_id === null ||
    revision.cover_media_asset_id === undefined
      ? null
      : Number(revision.cover_media_asset_id);
  if (coverMediaAssetId === null) return null;

  const media = database.prepare(
    `SELECT object_key, mime_type, width_px, height_px
       FROM media_assets
      WHERE id = ? AND public_usage_confirmed_at IS NOT NULL
      LIMIT 1`,
  ).get(coverMediaAssetId);
  const baseValue = process.env.OSS_ASSETS_BASE_URL?.trim().replace(/\/+$/, "");
  const objectKey = String(media?.object_key ?? "");
  const width = Number(media?.width_px);
  const height = Number(media?.height_px);
  if (
    !media ||
    !baseValue ||
    !objectKey.startsWith("media/") ||
    objectKey.includes("..") ||
    !Number.isSafeInteger(width) ||
    width < 1 ||
    !Number.isSafeInteger(height) ||
    height < 1 ||
    !revision.cover_alt
  ) {
    throw new Error("published_cover_snapshot_invalid");
  }
  const base = new URL(baseValue);
  if (base.protocol !== "https:" || base.pathname !== "/") {
    throw new Error("published_cover_origin_invalid");
  }
  return {
    url: new URL(
      objectKey.split("/").map(encodeURIComponent).join("/"),
      `${base.origin}/`,
    ).toString(),
    width,
    height,
    alt: String(revision.cover_alt),
    mimeType: publicCoverMimeType(media.mime_type),
  };
}

function auditAction(plan: ContentActionPlan) {
  if (plan.action === "save_draft") return "content_draft_saved" as const;
  if (plan.action === "publish") return "content_published" as const;
  if (plan.action === "offline") return "content_offlined" as const;
  return "content_republished" as const;
}

function publicFromRows(
  database: LocalSqliteDatabase,
  item: Row,
  revision: Row,
  contentType: ContentType,
): PublicContentSnapshot {
  const firstPublishedAt = sqliteDate(item.first_published_at);
  const publishedAt = sqliteDate(item.published_at);
  const updatedAt = sqliteDate(revision.created_at);
  if (!firstPublishedAt || !publishedAt || !updatedAt) {
    throw new Error("published_content_snapshot_missing");
  }
  return {
    id: Number(revision.id),
    contentItemId: Number(revision.content_item_id),
    revisionNumber: Number(revision.revision_number),
    contentType,
    slug: String(revision.slug),
    title: String(revision.title),
    summary: String(revision.summary),
    sanitizedHtml: String(revision.sanitized_html),
    sanitizerPolicyVersion: String(revision.sanitizer_policy_version),
    firstPublishedAt,
    publishedAt,
    updatedAt,
    coverImage: publicCoverImage(database, revision),
  };
}

export class SqliteContentRepository implements ContentRepository {
  private readonly path: string;
  private readonly database: LocalSqliteDatabase;

  constructor(runtime = getRuntimeSqlite()) {
    this.path = runtime.path;
    this.database = runtime.database;
  }

  async createDraft({ draft, actorAdminId, now, requestId }: {
    draft: ContentDraftFields;
    actorAdminId: number;
    now: Date;
    requestId: string;
  }) {
    return withSqliteWriteTransaction(this.path, this.database, async () => {
      try {
        assertConfirmedMedia(this.database, draft.sanitizedHtml);
        assertCoverMedia(this.database, draft);
        const timestamp = now.toISOString();
        const result = this.database.prepare(
          `INSERT INTO content_items
            (content_type, status, slug, title, summary, source_html,
             sanitized_html, sanitizer_policy_version, version,
             created_by, updated_by, created_at, updated_at)
           VALUES (?, 'draft', ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)`,
        ).run(
          draft.contentType, draft.slug, draft.title, draft.summary,
          draft.sourceHtml, draft.sanitizedHtml, draft.sanitizerPolicyVersion,
          actorAdminId, actorAdminId, timestamp, timestamp,
        );
        const itemId = Number(result.lastInsertRowid);
        const revisionId = insertRevision(this.database, itemId, {
          ...draft,
          revisionNumber: 1,
          status: "draft",
          actorAdminId,
          createdAt: now,
        });
        this.database.prepare("UPDATE content_items SET draft_revision_id = ? WHERE id = ?")
          .run(revisionId, itemId);
        insertSqliteSecurityAudit(this.database, {
          action: "content_created",
          actorAdminId,
          requestId,
          metadata: { itemId, revisionId, contentType: draft.contentType },
        }, now);
        return {
          item: {
            id: itemId, ...draft, publicStatus: "draft" as const, version: 1,
            draftRevisionId: revisionId, publishedRevisionId: null,
            firstPublishedAt: null, publishedAt: null, offlineAt: null,
            caseAuthorizationConfirmedAt: null,
            caseAuthorizationAdminId: null,
            caseAuthorizationRevisionId: null,
          },
          revision: {
            id: revisionId, contentItemId: itemId, ...draft,
            revisionNumber: 1, status: "draft" as const, actorAdminId, createdAt: now,
          },
          purgeJobId: null,
        };
      } catch (error) {
        if (String(error).toLowerCase().includes("unique")) {
          throw new Error("duplicate_slug");
        }
        throw error;
      }
    });
  }

  async mutate({
    itemId, expectedVersion, actorAdminId, now, requestId, publicOrigin,
    plan: buildPlan,
  }: {
    itemId: number;
    expectedVersion: number;
    actorAdminId: number;
    now: Date;
    requestId: string;
    publicOrigin: string;
    plan: (context: ContentMutationContext) => ContentActionPlan;
  }) {
    return withSqliteWriteTransaction(this.path, this.database, async () => {
      const row = this.database.prepare(`SELECT ${ITEM_COLUMNS} FROM content_items WHERE id = ? LIMIT 1`).get(itemId);
      if (!row) throw new Error("content_not_found");
      const item = itemFromRow(row);
      if (item.version !== expectedVersion) throw new Error("content_version_conflict");
      const draftRevision = loadRevision(this.database, item.draftRevisionId, item.contentType);
      const publishedRevision = loadRevision(this.database, item.publishedRevisionId, item.contentType);
      const plan = buildPlan({ item, draftRevision, publishedRevision });
      assertConfirmedMedia(this.database, plan.revision.sanitizedHtml);
      assertCoverMedia(this.database, plan.revision);
      const revisionId = insertRevision(this.database, item.id, plan.revision);
      const working = plan.action === "offline" ? item : { ...item, ...plan.revision };
      const draftRevisionId = plan.pointer === "draft"
        ? revisionId
        : plan.clearDraftPointer ? null : item.draftRevisionId;
      const publishedRevisionId = plan.pointer === "published"
        ? revisionId : item.publishedRevisionId;
      const authorizationConfirmedAt = plan.authorization?.confirmedAt ?? item.caseAuthorizationConfirmedAt;
      const authorizationAdminId = plan.authorization?.adminId ?? item.caseAuthorizationAdminId;
      const authorizationRevisionId = plan.authorization ? revisionId : item.caseAuthorizationRevisionId;
      const update = this.database.prepare(
        `UPDATE content_items SET
          status = ?, slug = ?, title = ?, summary = ?, source_html = ?,
          sanitized_html = ?, sanitizer_policy_version = ?, version = ?,
          draft_revision_id = ?, published_revision_id = ?, first_published_at = ?,
          published_at = ?, offline_at = ?, case_authorization_confirmed_at = ?,
          case_authorization_admin_id = ?, case_authorization_revision_id = ?,
          updated_by = ?, updated_at = ?
         WHERE id = ? AND version = ?`,
      ).run(
        plan.nextPublicStatus, working.slug, working.title, working.summary,
        working.sourceHtml, working.sanitizedHtml, working.sanitizerPolicyVersion,
        plan.nextVersion, draftRevisionId, publishedRevisionId,
        sqliteIso(plan.firstPublishedAt), sqliteIso(plan.publishedAt), sqliteIso(plan.offlineAt),
        sqliteIso(authorizationConfirmedAt), authorizationAdminId, authorizationRevisionId,
        actorAdminId, now.toISOString(), item.id, expectedVersion,
      );
      if (update.changes !== 1) throw new Error("content_version_conflict");
      if (plan.authorization) {
        insertSqliteSecurityAudit(this.database, {
          action: "case_authorization_confirmed", actorAdminId, requestId,
          metadata: { itemId: item.id, revisionId, contentType: item.contentType },
        }, now);
      }
      insertSqliteSecurityAudit(this.database, {
        action: auditAction(plan), actorAdminId, requestId,
        metadata: { itemId: item.id, revisionId, contentType: item.contentType, version: plan.nextVersion },
      }, now);

      let purgeJobId: number | null = null;
      if (plan.purgeAction) {
        const urls = buildContentPurgeUrls({
          publicOrigin,
          contentType: item.contentType,
          slug: plan.revision.slug,
          allowLocalHttp: true,
        });
        const idempotencyKey = createHash("sha256")
          .update(`${item.id}:${revisionId}:${plan.purgeAction}`).digest("hex");
        const job = this.database.prepare(
          `INSERT INTO cache_purge_jobs
            (idempotency_key, content_item_id, content_revision_id, action,
             urls_json, status, attempt_count, next_attempt_at, created_by,
             created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, 'pending', 0, ?, ?, ?, ?)`,
        ).run(
          idempotencyKey, item.id, revisionId, plan.purgeAction,
          JSON.stringify(urls), now.toISOString(), actorAdminId,
          now.toISOString(), now.toISOString(),
        );
        purgeJobId = Number(job.lastInsertRowid);
        insertSqliteSecurityAudit(this.database, {
          action: "cache_purge_enqueued", actorAdminId, requestId,
          metadata: { itemId: item.id, revisionId, purgeJobId, urlCount: urls.length },
        }, now);
      }
      return {
        item: {
          ...item, ...working, publicStatus: plan.nextPublicStatus,
          version: plan.nextVersion, draftRevisionId, publishedRevisionId,
          firstPublishedAt: plan.firstPublishedAt, publishedAt: plan.publishedAt,
          offlineAt: plan.offlineAt,
          caseAuthorizationConfirmedAt: authorizationConfirmedAt,
          caseAuthorizationAdminId: authorizationAdminId,
          caseAuthorizationRevisionId: authorizationRevisionId,
        },
        revision: { id: revisionId, contentItemId: item.id, ...plan.revision },
        purgeJobId,
      };
    });
  }

  async listByType(contentType: ContentType) {
    return this.database.prepare(
      `SELECT ${ITEM_COLUMNS} FROM content_items
        WHERE content_type = ? ORDER BY updated_at DESC, id DESC LIMIT 200`,
    ).all(contentType).map(itemFromRow);
  }

  async getAdminItem(itemId: number) {
    const row = this.database.prepare(`SELECT ${ITEM_COLUMNS} FROM content_items WHERE id = ? LIMIT 1`).get(itemId);
    if (!row) return null;
    const item = itemFromRow(row);
    return {
      item,
      draftRevision: loadRevision(this.database, item.draftRevisionId, item.contentType),
      publishedRevision: loadRevision(this.database, item.publishedRevisionId, item.contentType),
    };
  }

  async listRevisions(itemId: number) {
    const item = this.database.prepare("SELECT content_type FROM content_items WHERE id = ? LIMIT 1").get(itemId);
    if (!item) return [];
    const contentType = String(item.content_type) as ContentType;
    return this.database.prepare(
      `SELECT ${REVISION_COLUMNS} FROM content_revisions
        WHERE content_item_id = ? ORDER BY revision_number DESC, id DESC`,
    ).all(itemId).map((row) => revisionFromRow(row, contentType));
  }

  async listPublishedByType(contentType: ContentType) {
    const items = this.database.prepare(
      `SELECT ${ITEM_COLUMNS} FROM content_items
        WHERE content_type = ? AND status = 'published'
        ORDER BY published_at DESC, id DESC LIMIT 100`,
    ).all(contentType);
    return items.map((item) => {
      const revision = this.database.prepare(
        `SELECT ${REVISION_COLUMNS} FROM content_revisions
          WHERE id = ? AND content_item_id = ? AND status = 'published' LIMIT 1`,
      ).get(Number(item.published_revision_id), Number(item.id));
      if (!revision) throw new Error("published_content_snapshot_missing");
       return publicFromRows(this.database, item, revision, contentType);
    });
  }

  async getPublicBySlug(contentType: ContentType, slug: string) {
    const item = this.database.prepare(
      `SELECT ${ITEM_COLUMNS} FROM content_items WHERE content_type = ? AND slug = ? LIMIT 1`,
    ).get(contentType, slug);
    if (!item || item.status === "draft") return { status: "not_found" as const };
    if (item.status === "offline") return { status: "gone" as const };
    if (item.status !== "published" || item.published_revision_id === null) {
      throw new Error("published_content_status_invalid");
    }
    const revision = this.database.prepare(
      `SELECT ${REVISION_COLUMNS} FROM content_revisions
        WHERE id = ? AND content_item_id = ? AND status = 'published' LIMIT 1`,
    ).get(Number(item.published_revision_id), Number(item.id));
    if (!revision) throw new Error("published_content_snapshot_missing");
    return {
      status: "published" as const,
      item: publicFromRows(this.database, item, revision, contentType),
    };
  }
}
