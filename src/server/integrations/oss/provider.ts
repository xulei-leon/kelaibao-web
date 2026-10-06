import { createHmac } from "node:crypto";

import type {
  AuthorizePut,
  MediaObjectProvider,
} from "@/server/media/service";
import {
  MAX_MEDIA_BYTES,
  type AllowedMediaMimeType,
} from "@/server/media/validation";

export const IMMUTABLE_MEDIA_CACHE_CONTROL =
  "public, max-age=31536000, immutable";

type Environment = Record<string, string | undefined>;

export interface OssStsConfig {
  bucketName: string;
  bucketEndpoint: string;
  assetsBaseUrl: string;
  accessKeyId: string;
  accessKeySecret: string;
  securityToken: string;
  credentialExpiresAt: Date;
}

function required(env: Environment, name: string) {
  const value = env[name]?.trim();
  if (!value) throw new Error(`${name} is required for OSS access.`);
  return value;
}

export function resolveOssStsConfig(
  env: Environment = process.env,
  now = new Date(),
): OssStsConfig {
  const bucketEndpoint = required(env, "OSS_BUCKET_ENDPOINT").replace(
    /\/+$/,
    "",
  );
  const endpoint = new URL(bucketEndpoint);
  if (endpoint.protocol !== "https:" || endpoint.pathname !== "/") {
    throw new Error("OSS_BUCKET_ENDPOINT must be an HTTPS origin.");
  }
  const credentialExpiresAt = new Date(required(env, "OSS_STS_EXPIRES_AT"));
  if (
    Number.isNaN(credentialExpiresAt.getTime()) ||
    credentialExpiresAt.getTime() - now.getTime() < 60_000
  ) {
    throw new Error("OSS STS credentials must remain valid for at least 60 seconds.");
  }
  const assetsBaseUrl = required(env, "OSS_ASSETS_BASE_URL").replace(
    /\/+$/,
    "",
  );
  const assetsUrl = new URL(assetsBaseUrl);
  if (
    assetsUrl.protocol !== "https:" ||
    assetsUrl.pathname !== "/" ||
    assetsUrl.origin === endpoint.origin
  ) {
    throw new Error(
      "OSS_ASSETS_BASE_URL must be a distinct HTTPS ESA assets origin.",
    );
  }
  return {
    bucketName: required(env, "OSS_BUCKET_NAME"),
    bucketEndpoint,
    assetsBaseUrl,
    accessKeyId: required(env, "OSS_STS_ACCESS_KEY_ID"),
    accessKeySecret: required(env, "OSS_STS_ACCESS_KEY_SECRET"),
    securityToken: required(env, "OSS_STS_SECURITY_TOKEN"),
    credentialExpiresAt,
  };
}

export function publicAssetUrl(config: OssStsConfig, objectKey: string) {
  if (!objectKey.startsWith("media/")) {
    throw new Error("Only confirmed media objects may receive an assets URL.");
  }
  return `${config.assetsBaseUrl}/${encodedObjectKey(objectKey)}`;
}

function encodedObjectKey(objectKey: string) {
  if (
    !objectKey ||
    objectKey.startsWith("/") ||
    objectKey.includes("\\") ||
    objectKey.split("/").some((part) => !part || part === "." || part === "..")
  ) {
    throw new Error("OSS object key is invalid.");
  }
  return objectKey.split("/").map(encodeURIComponent).join("/");
}

function normalizedEtag(value: string | null) {
  const etag = value?.trim() ?? "";
  if (!/^"?[a-fA-F0-9]{32}"?$/.test(etag)) {
    throw new Error("OSS object ETag is missing or invalid.");
  }
  return etag.startsWith('"') ? etag : `"${etag}"`;
}

function canonicalOssHeaders(headers: Record<string, string>) {
  return Object.entries(headers)
    .filter(([name]) => name.toLowerCase().startsWith("x-oss-"))
    .map(([name, value]) => [name.toLowerCase(), value.trim()] as const)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([name, value]) => `${name}:${value}\n`)
    .join("");
}

function signedUrl({
  config,
  method,
  objectKey,
  expiresAt,
  headers = {},
  contentType = "",
}: {
  config: OssStsConfig;
  method: "GET" | "PUT" | "DELETE";
  objectKey: string;
  expiresAt: Date;
  headers?: Record<string, string>;
  contentType?: string;
}) {
  const expires = Math.floor(expiresAt.getTime() / 1_000);
  const canonicalResource = `/${config.bucketName}/${objectKey}`;
  const stringToSign = [
    method,
    "",
    contentType,
    String(expires),
    `${canonicalOssHeaders(headers)}${canonicalResource}`,
  ].join("\n");
  const signature = createHmac("sha1", config.accessKeySecret)
    .update(stringToSign)
    .digest("base64");
  const url = new URL(
    `${config.bucketEndpoint}/${encodedObjectKey(objectKey)}`,
  );
  url.searchParams.set("OSSAccessKeyId", config.accessKeyId);
  url.searchParams.set("Expires", String(expires));
  url.searchParams.set("Signature", signature);
  url.searchParams.set("security-token", config.securityToken);
  return url.toString();
}

function boundedExpiry(
  config: OssStsConfig,
  desired: Date,
  now = new Date(),
) {
  const expiry = new Date(
    Math.min(desired.getTime(), config.credentialExpiresAt.getTime() - 5_000),
  );
  if (expiry <= now) throw new Error("OSS authorization has no valid lifetime.");
  return expiry;
}

export function createOssPutAuthorizer(
  config: OssStsConfig,
  now: () => Date = () => new Date(),
): AuthorizePut {
  return async ({ intent, nonce }) => {
    const expiresAt = boundedExpiry(config, intent.expiresAt, now());
    const headers = {
      "content-type": intent.mimeType,
      "x-oss-meta-intent": intent.id,
      "x-oss-meta-nonce": nonce,
      "x-oss-meta-sha256": intent.expectedSha256,
    };
    return {
      url: signedUrl({
        config,
        method: "PUT",
        objectKey: intent.objectKey,
        expiresAt,
        headers,
        contentType: intent.mimeType,
      }),
      method: "PUT",
      headers,
      expiresAt,
    };
  };
}

export class DirectHttpsOssProvider implements MediaObjectProvider {
  constructor(
    private readonly config: OssStsConfig,
    private readonly request: typeof fetch = fetch,
  ) {}

  async inspectObject(objectKey: string) {
    const expiresAt = boundedExpiry(
      this.config,
      new Date(Date.now() + 60_000),
    );
    const response = await this.request(
      signedUrl({
        config: this.config,
        method: "GET",
        objectKey,
        expiresAt,
      }),
      {
        method: "GET",
        redirect: "error",
        cache: "no-store",
      },
    );
    if (!response.ok) {
      throw new Error(`OSS object inspection failed with status ${response.status}.`);
    }
    const declaredLength = Number(response.headers.get("content-length"));
    if (
      !Number.isSafeInteger(declaredLength) ||
      declaredLength <= 0 ||
      declaredLength > MAX_MEDIA_BYTES
    ) {
      throw new Error("OSS object length is outside the allowed boundary.");
    }
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length !== declaredLength || bytes.length > MAX_MEDIA_BYTES) {
      throw new Error("OSS object body length changed during inspection.");
    }
    return {
      bytes,
      contentType:
        response.headers.get("content-type")?.split(";")[0].trim() ?? "",
      contentLength: declaredLength,
      etag: normalizedEtag(response.headers.get("etag")),
    };
  }

  async promoteObject({
    sourceKey,
    targetKey,
    expectedSha256,
    sourceEtag,
    mimeType,
  }: {
    sourceKey: string;
    targetKey: string;
    expectedSha256: string;
    sourceEtag: string;
    mimeType: AllowedMediaMimeType;
  }) {
    const headers = {
      "cache-control": IMMUTABLE_MEDIA_CACHE_CONTROL,
      "content-type": mimeType,
      "x-oss-copy-source": `/${this.config.bucketName}/${encodedObjectKey(sourceKey)}`,
      "x-oss-copy-source-if-match": normalizedEtag(sourceEtag),
      "x-oss-forbid-overwrite": "true",
      "x-oss-meta-sha256": expectedSha256,
      "x-oss-metadata-directive": "REPLACE",
    };
    const expiresAt = boundedExpiry(
      this.config,
      new Date(Date.now() + 60_000),
    );
    const copy = await this.request(
      signedUrl({
        config: this.config,
        method: "PUT",
        objectKey: targetKey,
        expiresAt,
        headers,
        contentType: mimeType,
      }),
      {
        method: "PUT",
        headers,
        redirect: "error",
        cache: "no-store",
      },
    );
    if (!copy.ok && copy.status !== 409 && copy.status !== 412) {
      throw new Error(`OSS immutable promotion failed with status ${copy.status}.`);
    }
  }

  async cleanupObject(objectKey: string) {
    const expiresAt = boundedExpiry(
      this.config,
      new Date(Date.now() + 60_000),
    );
    const remove = await this.request(
      signedUrl({
        config: this.config,
        method: "DELETE",
        objectKey,
        expiresAt,
      }),
      {
        method: "DELETE",
        redirect: "error",
        cache: "no-store",
      },
    );
    if (!remove.ok && remove.status !== 404) {
      throw new Error(`OSS staging cleanup failed with status ${remove.status}.`);
    }
  }
}
