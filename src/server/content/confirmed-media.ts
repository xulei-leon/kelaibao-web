import type { DatabaseConnection } from "@/server/db/pool";

export function confirmedMediaObjectKeys(
  sanitizedHtml: string,
  assetsBaseUrl = process.env.OSS_ASSETS_BASE_URL,
) {
  const sources = Array.from(
    sanitizedHtml.matchAll(/<img\b[^>]*\bsrc="([^"]+)"[^>]*>/gi),
    (match) => match[1],
  );
  if (!sources.length) return [];
  if (!assetsBaseUrl?.trim()) {
    throw new Error("Confirmed media origin is not configured.");
  }
  const base = new URL(assetsBaseUrl.trim().replace(/\/+$/, ""));
  if (base.protocol !== "https:" || base.pathname !== "/") {
    throw new Error("Confirmed media origin is invalid.");
  }

  return [...new Set(sources.map((source) => {
    const url = new URL(source);
    if (
      url.origin !== base.origin ||
      url.protocol !== "https:" ||
      url.search ||
      url.hash
    ) {
      throw new Error("Content references media outside the confirmed origin.");
    }
    let objectKey: string;
    try {
      objectKey = decodeURIComponent(url.pathname.replace(/^\/+/, ""));
    } catch {
      throw new Error("Content media path encoding is invalid.");
    }
    if (
      !objectKey.startsWith("media/") ||
      objectKey.includes("..") ||
      objectKey.includes("\\")
    ) {
      throw new Error("Content references an unconfirmed media object.");
    }
    return objectKey;
  }))];
}

export async function assertConfirmedMediaReferences(
  connection: DatabaseConnection,
  sanitizedHtml: string,
  assetsBaseUrl = process.env.OSS_ASSETS_BASE_URL,
) {
  const objectKeys = confirmedMediaObjectKeys(
    sanitizedHtml,
    assetsBaseUrl,
  );
  if (!objectKeys.length) return;
  const placeholders = objectKeys.map(() => "?").join(", ");
  const [result] = await connection.query(
    `SELECT object_key
       FROM media_assets
      WHERE object_key IN (${placeholders})`,
    objectKeys,
  );
  const confirmed = new Set(
    (Array.isArray(result) ? result : []).map((row) =>
      String((row as Record<string, unknown>).object_key),
    ),
  );
  if (objectKeys.some((objectKey) => !confirmed.has(objectKey))) {
    throw new Error("Content references an unconfirmed media object.");
  }
}
