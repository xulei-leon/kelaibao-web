import { createHash, randomUUID } from "node:crypto";

import {
  inspectAllowedImage,
  validateMediaRequest,
  type AllowedMediaMimeType,
  type MediaRequest,
} from "@/server/media/validation";

const INTENT_DURATION_MS = 5 * 60 * 1_000;
const CONFIRMATION_LEASE_MS = 2 * 60 * 1_000;

export interface MediaUploadIntent {
  id: string;
  adminId: number;
  objectKey: string;
  mimeType: AllowedMediaMimeType;
  maxByteSize: number;
  expectedSha256: string;
  nonceHash: string;
  expiresAt: Date;
  consumedAt: Date | null;
  mediaAssetId: number | null;
  confirmationTokenHash: string | null;
  confirmationExpiresAt: Date | null;
  createdAt: Date;
}

export interface MediaAsset {
  id: number;
  objectKey: string;
  mimeType: AllowedMediaMimeType;
  byteSize: number;
  checksumSha256: string;
  width: number;
  height: number;
  publicUsageConfirmedAt: Date | null;
  publicUsageConfirmedBy: number | null;
  createdBy: number;
  createdAt: Date;
}

type MediaAssetInput = Omit<MediaAsset, "id">;

export interface MediaUploadRepository {
  createIntent(
    intent: MediaUploadIntent,
    requestId?: string,
  ): Promise<MediaUploadIntent>;
  claimIntent(input: {
    intentId: string;
    adminId: number;
    confirmationTokenHash: string;
    now: Date;
    leaseExpiresAt: Date;
  }): Promise<
    | { status: "claimed"; intent: MediaUploadIntent }
    | { status: "confirmed"; asset: MediaAsset }
    | { status: "in_progress" }
  >;
  releaseIntentClaim(
    intentId: string,
    confirmationTokenHash: string,
  ): Promise<void>;
  consumeIntent(
    intentId: string,
    confirmationTokenHash: string,
    asset: MediaAssetInput,
    consumedAt: Date,
    requestId?: string,
  ): Promise<MediaAsset>;
  recordCleanupDeferred(
    intentId: string,
    adminId: number,
    requestId?: string,
  ): Promise<void>;
  confirmPublicUsage(input: {
    mediaAssetId: number;
    adminId: number;
    confirmedAt: Date;
    requestId: string;
  }): Promise<MediaAsset>;
}

export interface UploadAuthorization {
  url: string;
  method: "PUT";
  headers: Record<string, string>;
  expiresAt: Date;
}

export type AuthorizePut = (input: {
  intent: MediaUploadIntent;
  nonce: string;
}) => Promise<UploadAuthorization>;

export interface MediaObjectProvider {
  inspectObject(objectKey: string): Promise<{
    bytes: Buffer;
    contentType: string;
    contentLength: number;
    etag: string;
  }>;
  promoteObject(input: {
    sourceKey: string;
    targetKey: string;
    expectedSha256: string;
    sourceEtag: string;
    mimeType: AllowedMediaMimeType;
  }): Promise<void>;
  cleanupObject(objectKey: string): Promise<void>;
}

function safeIdentifier(value: string) {
  const safe = value.replace(/[^a-zA-Z0-9-]/g, "");
  if (!safe) throw new Error("Upload intent identifier is invalid.");
  return safe;
}

export async function createMediaUploadIntent({
  adminId,
  input,
  repository,
  authorizePut,
  now = new Date(),
  createId = randomUUID,
  createNonce = randomUUID,
  requestId,
}: {
  adminId: number;
  input: MediaRequest;
  repository: MediaUploadRepository;
  authorizePut: AuthorizePut;
  now?: Date;
  createId?: () => string;
  createNonce?: () => string;
  requestId?: string;
}) {
  const media = validateMediaRequest(input);
  const id = safeIdentifier(createId());
  const nonce = createNonce();
  const nonceHash = createHash("sha256").update(nonce).digest("hex");
  const objectKey = `pending/${adminId}/${id}-${nonceHash.slice(
    0,
    16,
  )}.${media.extension}`;
  const intent: MediaUploadIntent = {
    id,
    adminId,
    objectKey,
    mimeType: media.mimeType,
    maxByteSize: media.byteSize,
    expectedSha256: media.sha256,
    nonceHash,
    expiresAt: new Date(now.getTime() + INTENT_DURATION_MS),
    consumedAt: null,
    mediaAssetId: null,
    confirmationTokenHash: null,
    confirmationExpiresAt: null,
    createdAt: now,
  };
  const authorization = await authorizePut({ intent, nonce });
  if (
    authorization.expiresAt > intent.expiresAt ||
    !authorization.url.startsWith("https://")
  ) {
    throw new Error("Upload authorization exceeds the intent boundary.");
  }
  await repository.createIntent(intent, requestId);
  return { intent, authorization };
}

export async function confirmMediaUpload({
  adminId,
  intentId,
  repository,
  provider,
  now = new Date(),
  createClaimToken = randomUUID,
  requestId,
}: {
  adminId: number;
  intentId: string;
  repository: MediaUploadRepository;
  provider: MediaObjectProvider;
  now?: Date;
  createClaimToken?: () => string;
  requestId?: string;
}) {
  const confirmationTokenHash = createHash("sha256")
    .update(createClaimToken())
    .digest("hex");
  const claim = await repository.claimIntent({
    intentId,
    adminId,
    confirmationTokenHash,
    now,
    leaseExpiresAt: new Date(now.getTime() + CONFIRMATION_LEASE_MS),
  });
  if (claim.status === "confirmed") return claim.asset;
  if (claim.status === "in_progress") {
    throw new Error("Upload intent confirmation is already in progress.");
  }

  const intent = claim.intent;
  let consumed = false;
  try {
    const object = await provider.inspectObject(intent.objectKey);
    if (object.contentLength !== object.bytes.length) {
      throw new Error("OSS object length does not match downloaded content.");
    }
    if (object.contentType !== intent.mimeType) {
      throw new Error("OSS object MIME does not match the upload intent.");
    }
    if (!object.etag.trim()) {
      throw new Error("OSS object ETag is required for immutable promotion.");
    }
    const inspected = inspectAllowedImage(object.bytes, {
      expectedMimeType: intent.mimeType,
      expectedByteSize: intent.maxByteSize,
      expectedSha256: intent.expectedSha256,
    });
    const extension =
      inspected.mimeType === "image/jpeg"
        ? "jpg"
        : inspected.mimeType === "image/png"
          ? "png"
          : "webp";
    const targetKey = `media/${adminId}/${safeIdentifier(
      intent.id,
    )}-${inspected.sha256.slice(0, 20)}.${extension}`;

    await provider.promoteObject({
      sourceKey: intent.objectKey,
      targetKey,
      expectedSha256: inspected.sha256,
      sourceEtag: object.etag,
      mimeType: inspected.mimeType,
    });

    const promoted = await provider.inspectObject(targetKey);
    if (promoted.contentLength !== promoted.bytes.length) {
      throw new Error("Promoted OSS object length does not match downloaded content.");
    }
    if (promoted.contentType !== intent.mimeType) {
      throw new Error("Promoted OSS object MIME does not match the upload intent.");
    }
    const verified = inspectAllowedImage(promoted.bytes, {
      expectedMimeType: intent.mimeType,
      expectedByteSize: intent.maxByteSize,
      expectedSha256: intent.expectedSha256,
    });

    const asset = await repository.consumeIntent(
      intent.id,
      confirmationTokenHash,
      {
        objectKey: targetKey,
        mimeType: verified.mimeType,
        byteSize: verified.byteSize,
        checksumSha256: verified.sha256,
        width: verified.width,
        height: verified.height,
        publicUsageConfirmedAt: null,
        publicUsageConfirmedBy: null,
        createdBy: adminId,
        createdAt: now,
      },
      now,
      requestId,
    );
    consumed = true;

    try {
      await provider.cleanupObject(intent.objectKey);
    } catch {
      try {
        await repository.recordCleanupDeferred(
          intent.id,
          adminId,
          requestId,
        );
      } catch {
        console.error(
          `Media cleanup deferral audit failed [${requestId ?? "media-confirm"}].`,
        );
      }
    }
    return asset;
  } finally {
    if (!consumed) {
      try {
        await repository.releaseIntentClaim(
          intent.id,
          confirmationTokenHash,
        );
      } catch {
        console.error(
          `Media confirmation claim release failed [${requestId ?? "media-confirm"}].`,
        );
      }
    }
  }
}

export async function confirmMediaPublicUsage({
  mediaAssetId,
  adminId,
  repository,
  now = new Date(),
  requestId,
}: {
  mediaAssetId: number;
  adminId: number;
  repository: MediaUploadRepository;
  now?: Date;
  requestId: string;
}) {
  if (!Number.isSafeInteger(mediaAssetId) || mediaAssetId < 1) {
    throw new Error("Media asset id is invalid.");
  }
  return repository.confirmPublicUsage({
    mediaAssetId,
    adminId,
    confirmedAt: now,
    requestId,
  });
}
