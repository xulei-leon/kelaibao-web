import { createHash } from "node:crypto";

import { insertSecurityAudit } from "@/server/audit/mysql";
import { assertConfirmedMediaReferences } from "@/server/content/confirmed-media";
import {
  type ContentActionPlan,
  type ContentDraftFields,
  type ContentItemState,
  type ContentRevisionSnapshot,
  type ContentType,
} from "@/server/content/domain";
import type { PublicContentSnapshot } from "@/server/content/public-contract";
import { buildContentPurgeUrls } from "@/server/content/purge";
import type {
  ContentMutationContext,
  ContentRepository,
} from "@/server/content/service";
import type { DatabaseConnection } from "@/server/db/pool";
import { withRuntimeDatabase } from "@/server/db/runtime";

type Row = Record<string, unknown>;
type PublicCoverMimeType = NonNullable<
  PublicContentSnapshot["coverImage"]
>["mimeType"];
type DatabaseRunner = <T>(
  callback: (connection: DatabaseConnection) => Promise<T>,
) => Promise<T>;

function rows(result: unknown) {
  return Array.isArray(result) ? (result as Row[]) : [];
}

function date(value: unknown) {
  return value instanceof Date ? value : value ? new Date(String(value)) : null;
}

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
    draftRevisionId:
      row.draft_revision_id === null || row.draft_revision_id === undefined
        ? null
        : Number(row.draft_revision_id),
    publishedRevisionId:
      row.published_revision_id === null ||
      row.published_revision_id === undefined
        ? null
        : Number(row.published_revision_id),
    firstPublishedAt: date(row.first_published_at),
    publishedAt: date(row.published_at),
    offlineAt: date(row.offline_at),
    caseAuthorizationConfirmedAt: date(
      row.case_authorization_confirmed_at,
    ),
    caseAuthorizationAdminId:
      row.case_authorization_admin_id === null ||
      row.case_authorization_admin_id === undefined
        ? null
        : Number(row.case_authorization_admin_id),
    caseAuthorizationRevisionId:
      row.case_authorization_revision_id === null ||
      row.case_authorization_revision_id === undefined
        ? null
        : Number(row.case_authorization_revision_id),
  };
}

function revisionFromRow(
  row: Row,
  contentType: ContentType,
): ContentRevisionSnapshot {
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
    coverAlt: row.cover_alt === null || row.cover_alt === undefined
      ? null
      : String(row.cover_alt),
    status: String(row.status) as ContentRevisionSnapshot["status"],
    actorAdminId: Number(row.actor_admin_id),
    createdAt: date(row.created_at) ?? new Date(0),
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

const PUBLIC_CONTENT_COLUMNS = `
  i.status AS item_status,
  i.deleted_at AS item_deleted_at,
  i.first_published_at,
  i.published_at,
  r.id AS revision_id,
  r.content_item_id,
  r.revision_number,
  r.slug,
  r.title,
  r.summary,
  r.sanitized_html,
  r.sanitizer_policy_version,
  r.created_at AS revision_created_at,
  r.cover_media_asset_id,
  r.cover_alt,
  m.object_key AS cover_object_key,
  m.mime_type AS cover_mime_type,
  m.width_px AS cover_width_px,
  m.height_px AS cover_height_px
`;

function requiredDate(value: unknown) {
  const parsed = date(value);
  if (!parsed || Number.isNaN(parsed.getTime())) {
    throw new Error("published_content_snapshot_missing");
  }
  return parsed;
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

function publicContentFromRow(
  row: Row,
  contentType: ContentType,
): PublicContentSnapshot {
  const id = Number(row.revision_id);
  const contentItemId = Number(row.content_item_id);
  const revisionNumber = Number(row.revision_number);
  if (
    !Number.isSafeInteger(id) ||
    id < 1 ||
    !Number.isSafeInteger(contentItemId) ||
    contentItemId < 1 ||
    !Number.isSafeInteger(revisionNumber) ||
    revisionNumber < 1
  ) {
    throw new Error("published_content_snapshot_missing");
  }
  const coverMediaAssetId =
    row.cover_media_asset_id === null || row.cover_media_asset_id === undefined
      ? null
      : Number(row.cover_media_asset_id);
  let coverImage: PublicContentSnapshot["coverImage"] = null;
  if (coverMediaAssetId !== null) {
    const baseValue = process.env.OSS_ASSETS_BASE_URL?.trim().replace(/\/+$/, "");
    const objectKey = String(row.cover_object_key ?? "");
    const width = Number(row.cover_width_px);
    const height = Number(row.cover_height_px);
    if (
      !baseValue ||
      !objectKey.startsWith("media/") ||
      objectKey.includes("..") ||
      !Number.isSafeInteger(width) || width < 1 ||
      !Number.isSafeInteger(height) || height < 1 ||
      !row.cover_alt
    ) {
      throw new Error("published_cover_snapshot_invalid");
    }
    const base = new URL(baseValue);
    if (base.protocol !== "https:" || base.pathname !== "/") {
      throw new Error("published_cover_origin_invalid");
    }
    coverImage = {
      url: new URL(objectKey.split("/").map(encodeURIComponent).join("/"), `${base.origin}/`).toString(),
      width,
      height,
      alt: String(row.cover_alt),
      mimeType: publicCoverMimeType(row.cover_mime_type),
    };
  }
  return {
    id,
    contentItemId,
    revisionNumber,
    contentType,
    slug: String(row.slug),
    title: String(row.title),
    summary: String(row.summary),
    sanitizedHtml: String(row.sanitized_html),
    sanitizerPolicyVersion: String(row.sanitizer_policy_version),
    firstPublishedAt: requiredDate(row.first_published_at),
    publishedAt: requiredDate(row.published_at),
    updatedAt: requiredDate(row.revision_created_at),
    coverImage,
  };
}

async function assertCoverMedia(
  connection: DatabaseConnection,
  revision: Pick<ContentDraftFields, "coverMediaAssetId" | "coverAlt">,
) {
  if (revision.coverMediaAssetId === null && revision.coverAlt === null) return;
  if (revision.coverMediaAssetId === null || revision.coverAlt === null) {
    throw new Error("Cover media asset and cover alt must be provided together.");
  }
  const [result] = await connection.query(
    `SELECT id, mime_type, byte_size, width_px, height_px,
            public_usage_confirmed_at
       FROM media_assets
      WHERE id = ?
      LIMIT 1`,
    [revision.coverMediaAssetId],
  );
  const media = rows(result)[0];
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

async function loadRevision(
  connection: DatabaseConnection,
  id: number | null,
  contentType: ContentType,
) {
  if (id === null) return null;
  const [result] = await connection.query(
    `SELECT ${REVISION_COLUMNS}
       FROM content_revisions
      WHERE id = ?
      LIMIT 1`,
    [id],
  );
  const row = rows(result)[0];
  if (!row) throw new Error("content_revision_missing");
  return revisionFromRow(row, contentType);
}

async function insertRevision(
  connection: DatabaseConnection,
  itemId: number,
  revision: Omit<ContentRevisionSnapshot, "id" | "contentItemId">,
) {
  const [result] = await connection.query(
    `INSERT INTO content_revisions
      (content_item_id, revision_number, slug, title, summary,
       source_html, sanitized_html, sanitizer_policy_version,
       status, cover_media_asset_id, cover_alt, actor_admin_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
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
      revision.createdAt,
    ],
  );
  const id = Number((result as { insertId?: number }).insertId);
  if (!id) throw new Error("content_revision_insert_failed");
  return id;
}

function auditAction(plan: ContentActionPlan) {
  if (plan.action === "delete") return "content_deleted" as const;
  if (plan.action === "save_draft") return "content_draft_saved" as const;
  if (plan.action === "publish") return "content_published" as const;
  if (plan.action === "offline") return "content_offlined" as const;
  return "content_republished" as const;
}

export class MySqlContentRepository implements ContentRepository {
  constructor(
    private readonly database: DatabaseRunner = withRuntimeDatabase,
  ) {}

  async createDraft({
    draft,
    actorAdminId,
    now,
    requestId,
  }: {
    draft: ContentDraftFields;
    actorAdminId: number;
    now: Date;
    requestId: string;
  }) {
    return this.database(async (connection) => {
      await connection.beginTransaction();
      try {
        await assertConfirmedMediaReferences(
          connection,
          draft.sanitizedHtml,
        );
        await assertCoverMedia(connection, draft);
        const [itemResult] = await connection.query(
          `INSERT INTO content_items
            (content_type, status, slug, title, summary, source_html,
             sanitized_html, sanitizer_policy_version, version,
             created_by, updated_by, created_at, updated_at)
           VALUES (?, 'draft', ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)`,
          [
            draft.contentType,
            draft.slug,
            draft.title,
            draft.summary,
            draft.sourceHtml,
            draft.sanitizedHtml,
            draft.sanitizerPolicyVersion,
            actorAdminId,
            actorAdminId,
            now,
            now,
          ],
        );
        const itemId = Number(
          (itemResult as { insertId?: number }).insertId,
        );
        if (!itemId) throw new Error("content_item_insert_failed");
        const revisionId = await insertRevision(connection, itemId, {
          ...draft,
          revisionNumber: 1,
          status: "draft",
          actorAdminId,
          createdAt: now,
        });
        await connection.query(
          `UPDATE content_items
              SET draft_revision_id = ?
            WHERE id = ?`,
          [revisionId, itemId],
        );
        await insertSecurityAudit(connection, {
          action: "content_created",
          actorAdminId,
          requestId,
          metadata: {
            itemId,
            revisionId,
            contentType: draft.contentType,
          },
        });
        await connection.commit();
        return {
          item: {
            id: itemId,
            ...draft,
            publicStatus: "draft" as const,
            version: 1,
            draftRevisionId: revisionId,
            publishedRevisionId: null,
            firstPublishedAt: null,
            publishedAt: null,
            offlineAt: null,
            caseAuthorizationConfirmedAt: null,
            caseAuthorizationAdminId: null,
            caseAuthorizationRevisionId: null,
          },
          revision: {
            id: revisionId,
            contentItemId: itemId,
            ...draft,
            revisionNumber: 1,
            status: "draft" as const,
            actorAdminId,
            createdAt: now,
          },
          purgeJobId: null,
        };
      } catch (error) {
        await connection.rollback();
        if ((error as { code?: string }).code === "ER_DUP_ENTRY") {
          throw new Error("duplicate_slug");
        }
        throw error;
      }
    });
  }

  async mutate({
    itemId,
    expectedVersion,
    actorAdminId,
    now,
    requestId,
    publicOrigin,
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
    return this.database(async (connection) => {
      await connection.beginTransaction();
      try {
        const [itemResult] = await connection.query(
          `SELECT ${ITEM_COLUMNS}
             FROM content_items
            WHERE id = ? AND deleted_at IS NULL
            FOR UPDATE`,
          [itemId],
        );
        const row = rows(itemResult)[0];
        if (!row) throw new Error("content_not_found");
        const item = itemFromRow(row);
        if (item.version !== expectedVersion) {
          throw new Error("content_version_conflict");
        }
        const draftRevision = await loadRevision(
          connection,
          item.draftRevisionId,
          item.contentType,
        );
        const publishedRevision = await loadRevision(
          connection,
          item.publishedRevisionId,
          item.contentType,
        );
        const plan = buildPlan({
          item,
          draftRevision,
          publishedRevision,
        });
        if (plan.action !== "delete") {
          await assertConfirmedMediaReferences(connection, plan.revision.sanitizedHtml);
          await assertCoverMedia(connection, plan.revision);
        }
        const revisionId = await insertRevision(
          connection,
          item.id,
          plan.revision,
        );
        const working =
          plan.action === "offline" || plan.action === "delete"
            ? item
            : {
                ...item,
                ...plan.revision,
              };
        const draftRevisionId =
          plan.pointer === "draft"
            ? revisionId
            : plan.clearDraftPointer
              ? null
              : item.draftRevisionId;
        const publishedRevisionId =
          plan.pointer === "published"
            ? revisionId
            : item.publishedRevisionId;
        const authorizationConfirmedAt =
          plan.authorization?.confirmedAt ??
          item.caseAuthorizationConfirmedAt;
        const authorizationAdminId =
          plan.authorization?.adminId ??
          item.caseAuthorizationAdminId;
        const authorizationRevisionId = plan.authorization
          ? revisionId
          : item.caseAuthorizationRevisionId;
        const [updateResult] = await connection.query(
          `UPDATE content_items
              SET status = ?, slug = ?, title = ?, summary = ?,
                  source_html = ?, sanitized_html = ?,
                  sanitizer_policy_version = ?, version = ?,
                  draft_revision_id = ?, published_revision_id = ?,
                  first_published_at = ?, published_at = ?, offline_at = ?,
                  case_authorization_confirmed_at = ?,
                  case_authorization_admin_id = ?,
                  case_authorization_revision_id = ?,
                  updated_by = ?, updated_at = ?,
                  deleted_at = COALESCE(?, deleted_at)
            WHERE id = ? AND version = ? AND deleted_at IS NULL`,
          [
            plan.nextPublicStatus,
            working.slug,
            working.title,
            working.summary,
            working.sourceHtml,
            working.sanitizedHtml,
            working.sanitizerPolicyVersion,
            plan.nextVersion,
            draftRevisionId,
            publishedRevisionId,
            plan.firstPublishedAt,
            plan.publishedAt,
            plan.offlineAt,
            authorizationConfirmedAt,
            authorizationAdminId,
            authorizationRevisionId,
            actorAdminId,
            now,
            plan.deletedAt ?? null,
            item.id,
            expectedVersion,
          ],
        );
        if (
          Number((updateResult as { affectedRows?: number }).affectedRows) !==
          1
        ) {
          throw new Error("content_version_conflict");
        }
        if (plan.authorization) {
          await insertSecurityAudit(connection, {
            action: "case_authorization_confirmed",
            actorAdminId,
            requestId,
            metadata: {
              itemId: item.id,
              revisionId,
              contentType: item.contentType,
            },
          });
        }
        await insertSecurityAudit(connection, {
          action: auditAction(plan),
          actorAdminId,
          requestId,
          metadata: {
            itemId: item.id,
            revisionId,
            contentType: item.contentType,
            version: plan.nextVersion,
          },
        });

        let purgeJobId: number | null = null;
        if (plan.purgeAction) {
          const urls = buildContentPurgeUrls({
            publicOrigin,
            contentType: item.contentType,
            slug: plan.revision.slug,
          });
          const idempotencyKey = createHash("sha256")
            .update(`${item.id}:${revisionId}:${plan.purgeAction}`)
            .digest("hex");
          const [jobResult] = await connection.query(
            `INSERT INTO cache_purge_jobs
              (idempotency_key, content_item_id, content_revision_id,
               action, urls_json, status, attempt_count, next_attempt_at,
               created_by, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, 'pending', 0, ?, ?, ?, ?)`,
            [
              idempotencyKey,
              item.id,
              revisionId,
              plan.purgeAction,
              JSON.stringify(urls),
              now,
              actorAdminId,
              now,
              now,
            ],
          );
          purgeJobId = Number(
            (jobResult as { insertId?: number }).insertId,
          );
          if (!purgeJobId) throw new Error("cache_purge_job_insert_failed");
          await insertSecurityAudit(connection, {
            action: "cache_purge_enqueued",
            actorAdminId,
            requestId,
            metadata: {
              itemId: item.id,
              revisionId,
              purgeJobId,
              urlCount: urls.length,
            },
          });
        }
        await connection.commit();
        return {
          item: {
            ...item,
            ...working,
            publicStatus: plan.nextPublicStatus,
            version: plan.nextVersion,
            draftRevisionId,
            publishedRevisionId,
            firstPublishedAt: plan.firstPublishedAt,
            publishedAt: plan.publishedAt,
            offlineAt: plan.offlineAt,
            caseAuthorizationConfirmedAt: authorizationConfirmedAt,
            caseAuthorizationAdminId: authorizationAdminId,
            caseAuthorizationRevisionId: authorizationRevisionId,
          },
          revision: {
            id: revisionId,
            contentItemId: item.id,
            ...plan.revision,
          },
          purgeJobId,
        };
      } catch (error) {
        await connection.rollback();
        if ((error as { code?: string }).code === "ER_DUP_ENTRY") {
          throw new Error("duplicate_slug");
        }
        throw error;
      }
    });
  }

  async listByType(contentType: ContentType) {
    return this.database(async (connection) => {
      const [result] = await connection.query(
        `SELECT ${ITEM_COLUMNS}
           FROM content_items
          WHERE content_type = ? AND deleted_at IS NULL
          ORDER BY updated_at DESC, id DESC
          LIMIT 200`,
        [contentType],
      );
      return rows(result).map(itemFromRow);
    });
  }

  async getAdminItem(itemId: number) {
    return this.database(async (connection) => {
      const [result] = await connection.query(
        `SELECT ${ITEM_COLUMNS}
           FROM content_items
          WHERE id = ? AND deleted_at IS NULL
          LIMIT 1`,
        [itemId],
      );
      const row = rows(result)[0];
      if (!row) return null;
      const item = itemFromRow(row);
      return {
        item,
        draftRevision: await loadRevision(
          connection,
          item.draftRevisionId,
          item.contentType,
        ),
        publishedRevision: await loadRevision(
          connection,
          item.publishedRevisionId,
          item.contentType,
        ),
      };
    });
  }

  async listRevisions(itemId: number) {
    return this.database(async (connection) => {
      const [itemResult] = await connection.query(
        "SELECT content_type FROM content_items WHERE id = ? AND deleted_at IS NULL LIMIT 1",
        [itemId],
      );
      const item = rows(itemResult)[0];
      if (!item) return [];
      const contentType = String(item.content_type) as ContentType;
      const [result] = await connection.query(
        `SELECT ${REVISION_COLUMNS}
           FROM content_revisions
          WHERE content_item_id = ?
          ORDER BY revision_number DESC`,
        [itemId],
      );
      return rows(result).map((row) =>
        revisionFromRow(row, contentType),
      );
    });
  }

  async listPublishedByType(contentType: ContentType) {
    return this.database(async (connection) => {
      const [result] = await connection.query(
        `SELECT ${PUBLIC_CONTENT_COLUMNS}
           FROM content_items i
           JOIN content_revisions r
             ON r.id = i.published_revision_id
            AND r.content_item_id = i.id
             AND r.status = 'published'
           LEFT JOIN media_assets m ON m.id = r.cover_media_asset_id
          WHERE i.content_type = ?
            AND i.status = 'published'
            AND i.deleted_at IS NULL
            AND i.published_revision_id IS NOT NULL
          ORDER BY i.published_at DESC, i.id DESC
          LIMIT 100`,
        [contentType],
      );
      return rows(result).map((row) =>
        publicContentFromRow(row, contentType),
      );
    });
  }

  async getPublicBySlug(contentType: ContentType, slug: string) {
    return this.database(async (connection) => {
      const [result] = await connection.query(
        `SELECT ${PUBLIC_CONTENT_COLUMNS}
           FROM content_items i
           LEFT JOIN content_revisions r
             ON r.id = i.published_revision_id
            AND r.content_item_id = i.id
             AND r.status = 'published'
           LEFT JOIN media_assets m ON m.id = r.cover_media_asset_id
          WHERE i.content_type = ? AND i.slug = ?
          LIMIT 1`,
        [contentType, slug],
      );
      const row = rows(result)[0];
      if (!row) return { status: "not_found" as const };
      if (row.item_deleted_at) {
        return { status: row.first_published_at ? "gone" as const : "not_found" as const };
      }
      if (row.item_status === "draft") {
        return { status: "not_found" as const };
      }
      if (row.item_status === "offline") {
        return { status: "gone" as const };
      }
      if (row.item_status !== "published") {
        throw new Error("published_content_status_invalid");
      }
      return {
        status: "published" as const,
        item: publicContentFromRow(row, contentType),
      };
    });
  }
}
