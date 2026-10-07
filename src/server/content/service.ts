import { randomBytes } from "node:crypto";

import {
  applyContentAction,
  normalizeContentDraft,
  type ContentActionPlan,
  type ContentDraftFields,
  type ContentItemState,
  type ContentRevisionSnapshot,
  type ContentType,
} from "@/server/content/domain";
import type {
  PublicContentResult,
  PublicContentSnapshot,
} from "@/server/content/public-contract";

type ContentDraftInput = Omit<
  Parameters<typeof normalizeContentDraft>[0],
  "slug"
> & { slug?: unknown };

export interface ContentMutationContext {
  item: ContentItemState;
  draftRevision: ContentRevisionSnapshot | null;
  publishedRevision: ContentRevisionSnapshot | null;
}

export interface ContentMutationResult {
  item: ContentItemState;
  revision: ContentRevisionSnapshot;
  purgeJobId: number | null;
}

export interface ContentRepository {
  createDraft(input: {
    draft: ContentDraftFields;
    actorAdminId: number;
    now: Date;
    requestId: string;
  }): Promise<ContentMutationResult>;
  mutate(input: {
    itemId: number;
    expectedVersion: number;
    actorAdminId: number;
    now: Date;
    requestId: string;
    publicOrigin: string;
    plan: (context: ContentMutationContext) => ContentActionPlan;
  }): Promise<ContentMutationResult>;
  listByType(contentType: ContentType): Promise<ContentItemState[]>;
  getAdminItem(itemId: number): Promise<ContentMutationContext | null>;
  listRevisions(itemId: number): Promise<ContentRevisionSnapshot[]>;
  listPublishedByType(
    contentType: ContentType,
  ): Promise<PublicContentSnapshot[]>;
  getPublicBySlug(
    contentType: ContentType,
    slug: string,
  ): Promise<PublicContentResult>;
}

export function parseItemId(value: unknown) {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id < 1) {
    throw new Error("Content item id is invalid.");
  }
  return id;
}

export function parseExpectedVersion(value: unknown) {
  const version = Number(value);
  if (!Number.isSafeInteger(version) || version < 1) {
    throw new Error("Expected content version is invalid.");
  }
  return version;
}

export async function createContentDraft({
  input,
  actorAdminId,
  repository,
  now = new Date(),
  requestId,
}: {
  input: ContentDraftInput;
  actorAdminId: number;
  repository: ContentRepository;
  now?: Date;
  requestId: string;
}) {
  const automatic = input.slug === undefined;
  let draft = normalizeContentDraft({
    ...input,
    slug: automatic ? `${input.contentType}-${randomBytes(8).toString("hex")}` : input.slug,
  });
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await repository.createDraft({ draft, actorAdminId, now, requestId });
    } catch (error) {
      if (!automatic || attempt >= 3 || !(error instanceof Error) || error.message !== "duplicate_slug") {
        throw error;
      }
      draft = { ...draft, slug: `${draft.contentType}-${randomBytes(8).toString("hex")}` };
    }
  }
}

export async function saveContentDraft({
  itemId,
  expectedVersion,
  input,
  actorAdminId,
  repository,
  now = new Date(),
  requestId,
  publicOrigin,
}: {
  itemId: number;
  expectedVersion: number;
  input: ContentDraftInput;
  actorAdminId: number;
  repository: ContentRepository;
  now?: Date;
  requestId: string;
  publicOrigin: string;
}) {
  return repository.mutate({
    itemId,
    expectedVersion,
    actorAdminId,
    now,
    requestId,
    publicOrigin,
    plan: ({ item }) =>
      applyContentAction({
        action: "save_draft",
        item,
        expectedVersion,
        actorAdminId,
        now,
        draft: normalizeContentDraft({
          ...input,
          slug: input.slug === undefined ? item.slug : input.slug,
        }),
      }),
  });
}

export async function publishContent({
  itemId,
  expectedVersion,
  confirmCaseAuthorization,
  actorAdminId,
  repository,
  now = new Date(),
  requestId,
  publicOrigin,
}: {
  itemId: number;
  expectedVersion: number;
  confirmCaseAuthorization: boolean;
  actorAdminId: number;
  repository: ContentRepository;
  now?: Date;
  requestId: string;
  publicOrigin: string;
}) {
  return repository.mutate({
    itemId,
    expectedVersion,
    actorAdminId,
    now,
    requestId,
    publicOrigin,
    plan: ({ item, draftRevision }) =>
      applyContentAction({
        action: "publish",
        item,
        expectedVersion,
        actorAdminId,
        now,
        draftRevision: draftRevision ?? undefined,
        confirmCaseAuthorization,
      }),
  });
}

export async function offlineContent({
  itemId,
  expectedVersion,
  actorAdminId,
  repository,
  now = new Date(),
  requestId,
  publicOrigin,
}: {
  itemId: number;
  expectedVersion: number;
  actorAdminId: number;
  repository: ContentRepository;
  now?: Date;
  requestId: string;
  publicOrigin: string;
}) {
  return repository.mutate({
    itemId,
    expectedVersion,
    actorAdminId,
    now,
    requestId,
    publicOrigin,
    plan: ({ item, publishedRevision }) =>
      applyContentAction({
        action: "offline",
        item,
        expectedVersion,
        actorAdminId,
        now,
        publishedRevision: publishedRevision ?? undefined,
      }),
  });
}

export async function republishContent({
  itemId,
  expectedVersion,
  actorAdminId,
  repository,
  now = new Date(),
  requestId,
  publicOrigin,
}: {
  itemId: number;
  expectedVersion: number;
  actorAdminId: number;
  repository: ContentRepository;
  now?: Date;
  requestId: string;
  publicOrigin: string;
}) {
  return repository.mutate({
    itemId,
    expectedVersion,
    actorAdminId,
    now,
    requestId,
    publicOrigin,
    plan: ({ item, draftRevision, publishedRevision }) =>
      applyContentAction({
        action: "republish",
        item,
        expectedVersion,
        actorAdminId,
        now,
        draftRevision: draftRevision ?? undefined,
        publishedRevision: publishedRevision ?? undefined,
      }),
  });
}

export async function deleteNews({
  itemId, expectedVersion, actorAdminId, repository,
  now = new Date(), requestId, publicOrigin,
}: {
  itemId: number;
  expectedVersion: number;
  actorAdminId: number;
  repository: ContentRepository;
  now?: Date;
  requestId: string;
  publicOrigin: string;
}) {
  return repository.mutate({
    itemId, expectedVersion, actorAdminId, now, requestId, publicOrigin,
    plan: ({ item, draftRevision, publishedRevision }) => applyContentAction({
      action: "delete", item, expectedVersion, actorAdminId, now,
      draftRevision: draftRevision ?? undefined,
      publishedRevision: publishedRevision ?? undefined,
    }),
  });
}
