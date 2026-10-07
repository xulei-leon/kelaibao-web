import {
  assertPublishableHtml,
  sanitizeAdminHtml,
} from "@/server/security/html/sanitizer";

export type ContentType = "news" | "case";
export type PublicContentStatus = "draft" | "published" | "offline";
export type RevisionStatus = PublicContentStatus;

export interface ContentDraftFields {
  contentType: ContentType;
  slug: string;
  title: string;
  summary: string;
  sourceHtml: string;
  sanitizedHtml: string;
  sanitizerPolicyVersion: string;
  coverMediaAssetId: number | null;
  coverAlt: string | null;
}

export interface ContentItemState extends ContentDraftFields {
  id: number;
  publicStatus: PublicContentStatus;
  version: number;
  draftRevisionId: number | null;
  publishedRevisionId: number | null;
  firstPublishedAt: Date | null;
  publishedAt: Date | null;
  offlineAt: Date | null;
  caseAuthorizationConfirmedAt: Date | null;
  caseAuthorizationAdminId: number | null;
  caseAuthorizationRevisionId: number | null;
}

export interface ContentRevisionSnapshot extends ContentDraftFields {
  id: number;
  contentItemId: number;
  revisionNumber: number;
  status: RevisionStatus;
  actorAdminId: number;
  createdAt: Date;
}

export type ContentAction =
  | "save_draft"
  | "publish"
  | "offline"
  | "delete"
  | "republish";

export interface ContentActionPlan {
  action: ContentAction;
  nextVersion: number;
  nextPublicStatus: PublicContentStatus;
  revision: Omit<ContentRevisionSnapshot, "id" | "contentItemId">;
  pointer: "draft" | "published" | "none";
  clearDraftPointer: boolean;
  keepPublishedRevisionId: number | null;
  firstPublishedAt: Date | null;
  publishedAt: Date | null;
  offlineAt: Date | null;
  authorization: {
    confirmedAt: Date;
    adminId: number;
    bindToNewRevision: true;
  } | null;
  purgeAction: "publish" | "offline" | "republish" | null;
  deletedAt?: Date;
}

function text(value: unknown, name: string, maximum: number) {
  if (typeof value !== "string") {
    throw new Error(`${name} must be a string.`);
  }
  const normalized = value.trim();
  const length = [...normalized].length;
  if (length < 1 || length > maximum) {
    throw new Error(`${name} must contain between 1 and ${maximum} characters.`);
  }
  return normalized;
}

function contentType(value: unknown): ContentType {
  if (value !== "news" && value !== "case") {
    throw new Error("Content type must be news or case.");
  }
  return value;
}

function slug(value: unknown) {
  if (typeof value !== "string") throw new Error("Slug must be a string.");
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");
  if (
    normalized.length < 1 ||
    normalized.length > 191 ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalized)
  ) {
    throw new Error("Slug must use lowercase ASCII kebab-case.");
  }
  return normalized;
}

function coverFields(coverMediaAssetId: unknown, coverAlt: unknown) {
  const rawId = coverMediaAssetId === "" ? null : coverMediaAssetId;
  const rawAlt = typeof coverAlt === "string" ? coverAlt.trim() : coverAlt;
  const emptyId = rawId === null || rawId === undefined;
  const emptyAlt = rawAlt === null || rawAlt === undefined || rawAlt === "";
  if (emptyId && emptyAlt) {
    return { coverMediaAssetId: null, coverAlt: null };
  }
  const id = Number(rawId);
  if (emptyId || emptyAlt || !Number.isSafeInteger(id) || id < 1) {
    throw new Error("Cover media asset and cover alt must be provided together.");
  }
  if (/^[^\r\n]+\.(?:jpe?g|png|webp)$/i.test(String(rawAlt))) {
    throw new Error("Cover alt must describe the image instead of repeating a file name.");
  }
  return {
    coverMediaAssetId: id,
    coverAlt: text(rawAlt, "Cover alt", 240),
  };
}

export function normalizeContentDraft(input: {
  contentType: unknown;
  slug: unknown;
  title: unknown;
  summary: unknown;
  sourceHtml: unknown;
  coverMediaAssetId?: unknown;
  coverAlt?: unknown;
}): ContentDraftFields {
  const sourceHtml = text(input.sourceHtml, "Source HTML", 500_000);
  const sanitized = sanitizeAdminHtml(sourceHtml);
  assertPublishableHtml(sanitized);
  return {
    contentType: contentType(input.contentType),
    slug: slug(input.slug),
    title: text(input.title, "Title", 160),
    summary: text(input.summary, "Summary", 320),
    sourceHtml,
    sanitizedHtml: sanitized.html,
    sanitizerPolicyVersion: sanitized.policyVersion,
    ...coverFields(input.coverMediaAssetId, input.coverAlt),
  };
}

function assertExpectedVersion(item: ContentItemState, expectedVersion: number) {
  if (
    !Number.isSafeInteger(expectedVersion) ||
    expectedVersion < 1 ||
    item.version !== expectedVersion
  ) {
    throw new Error("Content version conflict.");
  }
}

function assertImmutableIdentity(
  item: ContentItemState,
  draft: ContentDraftFields,
) {
  if (item.contentType !== draft.contentType) {
    throw new Error("Content type is immutable.");
  }
  if (item.firstPublishedAt !== null && item.slug !== draft.slug) {
    throw new Error("Content slug is immutable after first publication.");
  }
}

function revisionFrom(
  source: ContentDraftFields | ContentRevisionSnapshot,
  {
    revisionNumber,
    status,
    actorAdminId,
    now,
  }: {
    revisionNumber: number;
    status: RevisionStatus;
    actorAdminId: number;
    now: Date;
  },
): Omit<ContentRevisionSnapshot, "id" | "contentItemId"> {
  const current = normalizeContentDraft({
    contentType: source.contentType,
    slug: source.slug,
    title: source.title,
    summary: source.summary,
    sourceHtml: source.sourceHtml,
    coverMediaAssetId: source.coverMediaAssetId,
    coverAlt: source.coverAlt,
  });
  return {
    ...current,
    revisionNumber,
    status,
    actorAdminId,
    createdAt: now,
  };
}

export function applyContentAction(input: {
  action: ContentAction;
  item: ContentItemState;
  expectedVersion: number;
  actorAdminId: number;
  now: Date;
  draft?: ContentDraftFields;
  draftRevision?: ContentRevisionSnapshot;
  publishedRevision?: ContentRevisionSnapshot;
  confirmCaseAuthorization?: boolean;
}): ContentActionPlan {
  const {
    action,
    item,
    expectedVersion,
    actorAdminId,
    now,
    draft,
    draftRevision,
    publishedRevision,
    confirmCaseAuthorization = false,
  } = input;
  assertExpectedVersion(item, expectedVersion);
  const nextVersion = item.version + 1;

  if (action === "delete") {
    if (item.contentType !== "news") throw new Error("Only news deletion is allowed.");
    const publishedBefore = item.firstPublishedAt !== null;
    const status = publishedBefore ? "offline" : "draft";
    const source = draftRevision ?? publishedRevision ?? item;
    return {
      action, nextVersion, nextPublicStatus: status,
      revision: {
        contentType: item.contentType, slug: item.slug,
        title: source.title, summary: source.summary,
        sourceHtml: source.sourceHtml, sanitizedHtml: source.sanitizedHtml,
        sanitizerPolicyVersion: source.sanitizerPolicyVersion,
        coverMediaAssetId: source.coverMediaAssetId, coverAlt: source.coverAlt,
        revisionNumber: nextVersion, status, actorAdminId, createdAt: now,
      },
      pointer: "none", clearDraftPointer: false,
      keepPublishedRevisionId: item.publishedRevisionId,
      firstPublishedAt: item.firstPublishedAt, publishedAt: item.publishedAt,
      offlineAt: publishedBefore ? now : null,
      authorization: null, purgeAction: publishedBefore ? "offline" : null,
      deletedAt: now,
    };
  }

  if (action === "save_draft") {
    if (!draft) throw new Error("Draft fields are required.");
    assertImmutableIdentity(item, draft);
    return {
      action,
      nextVersion,
      nextPublicStatus: item.publicStatus,
      revision: revisionFrom(draft, {
        revisionNumber: nextVersion,
        status: "draft",
        actorAdminId,
        now,
      }),
      pointer: "draft",
      clearDraftPointer: false,
      keepPublishedRevisionId: item.publishedRevisionId,
      firstPublishedAt: item.firstPublishedAt,
      publishedAt: item.publishedAt,
      offlineAt: item.offlineAt,
      authorization: null,
      purgeAction: null,
    };
  }

  if (action === "publish") {
    if (
      (item.publicStatus !== "draft" &&
        item.publicStatus !== "published") ||
      !draftRevision
    ) {
      throw new Error("Invalid content transition for publish.");
    }
    if (item.publicStatus === "published" && item.draftRevisionId === null) {
      throw new Error("Invalid content transition: published content has no draft.");
    }
    assertImmutableIdentity(item, draftRevision);
    const needsAuthorization =
      item.contentType === "case" &&
      item.caseAuthorizationConfirmedAt === null;
    if (needsAuthorization && !confirmCaseAuthorization) {
      throw new Error("Case authorization confirmation is required.");
    }
    return {
      action,
      nextVersion,
      nextPublicStatus: "published",
      revision: revisionFrom(draftRevision, {
        revisionNumber: nextVersion,
        status: "published",
        actorAdminId,
        now,
      }),
      pointer: "published",
      clearDraftPointer: true,
      keepPublishedRevisionId: item.publishedRevisionId,
      firstPublishedAt: item.firstPublishedAt ?? now,
      publishedAt: now,
      offlineAt: null,
      authorization: needsAuthorization
        ? {
            confirmedAt: now,
            adminId: actorAdminId,
            bindToNewRevision: true,
          }
        : null,
      purgeAction: "publish",
    };
  }

  if (action === "offline") {
    if (item.publicStatus !== "published" || !publishedRevision) {
      throw new Error("Invalid content transition for offline.");
    }
    return {
      action,
      nextVersion,
      nextPublicStatus: "offline",
      revision: revisionFrom(publishedRevision, {
        revisionNumber: nextVersion,
        status: "offline",
        actorAdminId,
        now,
      }),
      pointer: "none",
      clearDraftPointer: false,
      keepPublishedRevisionId: item.publishedRevisionId,
      firstPublishedAt: item.firstPublishedAt,
      publishedAt: item.publishedAt,
      offlineAt: now,
      authorization: null,
      purgeAction: "offline",
    };
  }

  if (item.publicStatus !== "offline" || !publishedRevision) {
    throw new Error("Invalid content transition for republish.");
  }
  const source = draftRevision ?? publishedRevision;
  assertImmutableIdentity(item, source);
  return {
    action,
    nextVersion,
    nextPublicStatus: "published",
    revision: revisionFrom(source, {
      revisionNumber: nextVersion,
      status: "published",
      actorAdminId,
      now,
    }),
    pointer: "published",
    clearDraftPointer: draftRevision !== undefined,
    keepPublishedRevisionId: item.publishedRevisionId,
    firstPublishedAt: item.firstPublishedAt ?? now,
    publishedAt: now,
    offlineAt: null,
    authorization: null,
    purgeAction: "republish",
  };
}

export function contentForPublic(
  item: ContentItemState | null,
  publishedRevision: ContentRevisionSnapshot | null,
):
  | { status: "published"; item: ContentRevisionSnapshot }
  | { status: "not_found" }
  | { status: "gone" } {
  if (!item || item.publicStatus === "draft") return { status: "not_found" };
  if (item.publicStatus === "offline") return { status: "gone" };
  if (
    item.publishedRevisionId === null ||
    !publishedRevision ||
    publishedRevision.id !== item.publishedRevisionId
  ) {
    throw new Error("Published content snapshot is missing or mismatched.");
  }
  return { status: "published", item: publishedRevision };
}
