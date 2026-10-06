import {
  applyContentAction,
  contentForPublic,
  normalizeContentDraft,
  type ContentItemState,
  type ContentRevisionSnapshot,
} from "@/server/content/domain";
import { SANITIZER_POLICY_VERSION } from "@/server/security/html/sanitizer";
import { describe, expect, it } from "vitest";

const now = new Date("2026-07-30T02:00:00.000Z");

function draftItem(
  overrides: Partial<ContentItemState> = {},
): ContentItemState {
  return {
    id: 12,
    contentType: "news",
    publicStatus: "draft",
    slug: "market-update",
    title: "市场更新",
    summary: "这是可发布的摘要。",
    sourceHtml: "<p>正文</p>",
    sanitizedHtml: "<p>正文</p>",
    sanitizerPolicyVersion: SANITIZER_POLICY_VERSION,
    coverMediaAssetId: null,
    coverAlt: null,
    version: 1,
    draftRevisionId: 101,
    publishedRevisionId: null,
    firstPublishedAt: null,
    publishedAt: null,
    offlineAt: null,
    caseAuthorizationConfirmedAt: null,
    caseAuthorizationAdminId: null,
    caseAuthorizationRevisionId: null,
    ...overrides,
  };
}

function revision(
  overrides: Partial<ContentRevisionSnapshot> = {},
): ContentRevisionSnapshot {
  return {
    id: 101,
    contentItemId: 12,
    revisionNumber: 1,
    contentType: "news",
    slug: "market-update",
    title: "市场更新",
    summary: "这是可发布的摘要。",
    sourceHtml: "<p>正文</p>",
    sanitizedHtml: "<p>正文</p>",
    sanitizerPolicyVersion: SANITIZER_POLICY_VERSION,
    coverMediaAssetId: null,
    coverAlt: null,
    status: "draft",
    actorAdminId: 1,
    createdAt: new Date("2026-07-30T01:00:00.000Z"),
    ...overrides,
  };
}

describe("M2-03 content domain", () => {
  it("normalizes fields and rejects unsupported type, slug, lengths, or empty sanitized body", () => {
    expect(
      normalizeContentDraft({
        contentType: "news",
        title: "  标题  ",
        summary: "  摘要  ",
        slug: "Market Update",
        sourceHtml: "<p>正文</p>",
      }),
    ).toMatchObject({
      contentType: "news",
      title: "标题",
      summary: "摘要",
      slug: "market-update",
      sanitizedHtml: "<p>正文</p>",
      sanitizerPolicyVersion: SANITIZER_POLICY_VERSION,
    });
    expect(() =>
      normalizeContentDraft({
        contentType: "page",
        title: "标题",
        summary: "摘要",
        slug: "page",
        sourceHtml: "<p>正文</p>",
      }),
    ).toThrow(/content type/i);
    expect(() =>
      normalizeContentDraft({
        contentType: "news",
        title: "标题",
        summary: "摘要",
        slug: "../escape",
        sourceHtml: "<p>正文</p>",
      }),
    ).toThrow(/slug/i);
    expect(() =>
      normalizeContentDraft({
        contentType: "news",
        title: "标题",
        summary: "摘要",
        slug: "empty",
        sourceHtml: "<script>alert(1)</script>",
      }),
    ).toThrow(/publishable/i);
  });

  it("saves a draft on a published item without moving the public snapshot", () => {
    const item = draftItem({
      publicStatus: "published",
      version: 4,
      draftRevisionId: null,
      publishedRevisionId: 104,
      firstPublishedAt: new Date("2026-07-29T01:00:00.000Z"),
      publishedAt: new Date("2026-07-29T01:00:00.000Z"),
    });
    const fields = normalizeContentDraft({
      contentType: "news",
      title: "更新后的标题",
      summary: "更新后的摘要",
      slug: "market-update",
      sourceHtml: "<p>新的草稿</p>",
    });

    const plan = applyContentAction({
      action: "save_draft",
      item,
      expectedVersion: 4,
      actorAdminId: 1,
      now,
      draft: fields,
    });

    expect(plan.nextVersion).toBe(5);
    expect(plan.nextPublicStatus).toBe("published");
    expect(plan.keepPublishedRevisionId).toBe(104);
    expect(plan.revision.status).toBe("draft");
    expect(plan.pointer).toBe("draft");
    expect(plan.purgeAction).toBeNull();
  });

  it("requires first-publish case authorization and freezes slug afterwards", () => {
    const item = draftItem({
      contentType: "case",
      slug: "case-one",
    });
    const draft = revision({
      contentType: "case",
      slug: "case-one",
      status: "draft",
    });

    expect(() =>
      applyContentAction({
        action: "publish",
        item,
        expectedVersion: 1,
        actorAdminId: 7,
        now,
        draftRevision: draft,
        confirmCaseAuthorization: false,
      }),
    ).toThrow(/authorization/i);

    const published = applyContentAction({
      action: "publish",
      item,
      expectedVersion: 1,
      actorAdminId: 7,
      now,
      draftRevision: draft,
      confirmCaseAuthorization: true,
    });
    expect(published.nextPublicStatus).toBe("published");
    expect(published.pointer).toBe("published");
    expect(published.clearDraftPointer).toBe(true);
    expect(published.authorization).toEqual({
      confirmedAt: now,
      adminId: 7,
      bindToNewRevision: true,
    });

    expect(() =>
      applyContentAction({
        action: "save_draft",
        item: {
          ...item,
          publicStatus: "published",
          firstPublishedAt: now,
          publishedRevisionId: 102,
          version: 2,
        },
        expectedVersion: 2,
        actorAdminId: 7,
        now,
        draft: normalizeContentDraft({
          contentType: "case",
          title: "案例",
          summary: "摘要",
          slug: "changed-slug",
          sourceHtml: "<p>正文</p>",
        }),
      }),
    ).toThrow(/slug.*immutable/i);
  });

  it("supports offline and republish while rejecting stale or illegal actions", () => {
    const publishedRevision = revision({
      id: 104,
      revisionNumber: 4,
      status: "published",
    });
    const published = draftItem({
      publicStatus: "published",
      version: 4,
      draftRevisionId: null,
      publishedRevisionId: 104,
      firstPublishedAt: new Date("2026-07-29T01:00:00.000Z"),
      publishedAt: new Date("2026-07-29T01:00:00.000Z"),
    });

    expect(() =>
      applyContentAction({
        action: "offline",
        item: published,
        expectedVersion: 3,
        actorAdminId: 1,
        now,
        publishedRevision,
      }),
    ).toThrow(/version conflict/i);
    expect(() =>
      applyContentAction({
        action: "offline",
        item: draftItem(),
        expectedVersion: 1,
        actorAdminId: 1,
        now,
        publishedRevision,
      }),
    ).toThrow(/transition/i);

    const offline = applyContentAction({
      action: "offline",
      item: published,
      expectedVersion: 4,
      actorAdminId: 1,
      now,
      publishedRevision,
    });
    expect(offline.nextPublicStatus).toBe("offline");
    expect(offline.keepPublishedRevisionId).toBe(104);
    expect(offline.purgeAction).toBe("offline");

    const republished = applyContentAction({
      action: "republish",
      item: {
        ...published,
        publicStatus: "offline",
        version: 5,
        offlineAt: now,
      },
      expectedVersion: 5,
      actorAdminId: 1,
      now: new Date("2026-07-30T02:10:00.000Z"),
      publishedRevision,
    });
    expect(republished.nextPublicStatus).toBe("published");
    expect(republished.purgeAction).toBe("republish");
    expect(republished.revision.status).toBe("published");
  });

  it("exposes only the published pointer and distinguishes not-found from gone", () => {
    const published = revision({ id: 104, status: "published" });
    expect(
      contentForPublic(
        draftItem({
          publicStatus: "published",
          publishedRevisionId: 104,
        }),
        published,
      ),
    ).toEqual({ status: "published", item: published });
    expect(contentForPublic(draftItem(), null)).toEqual({
      status: "not_found",
    });
    expect(
      contentForPublic(
        draftItem({
          publicStatus: "offline",
          publishedRevisionId: 104,
        }),
        published,
      ),
    ).toEqual({ status: "gone" });
    expect(contentForPublic(null, null)).toEqual({ status: "not_found" });
  });
});
