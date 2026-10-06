import type { ContentType } from "@/server/content/domain";

const RETRY_DELAYS_MS = [5_000, 15_000] as const;

function exactOrigin(value: string, allowLocalHttp: boolean) {
  const url = new URL(value);
  const localHttp =
    allowLocalHttp &&
    url.protocol === "http:" &&
    ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (
    (url.protocol !== "https:" && !localHttp) ||
    url.pathname !== "/" ||
    url.search ||
    url.hash ||
    url.origin !== value.replace(/\/+$/, "")
  ) {
    throw new Error("Public origin must be an exact HTTPS origin.");
  }
  return url.origin;
}

function assertSlug(slug: string) {
  if (
    slug.length < 1 ||
    slug.length > 191 ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
  ) {
    throw new Error("Content purge slug is invalid.");
  }
  return slug;
}

export function buildContentPurgeUrls({
  publicOrigin,
  contentType,
  slug,
  oldPublicSlug,
  allowLocalHttp = false,
}: {
  publicOrigin: string;
  contentType: ContentType;
  slug: string;
  oldPublicSlug?: string;
  allowLocalHttp?: boolean;
}) {
  const origin = exactOrigin(publicOrigin, allowLocalHttp);
  const collection = contentType === "news" ? "news" : "cases";
  const slugs = [assertSlug(slug)];
  if (oldPublicSlug && oldPublicSlug !== slug) {
    slugs.push(assertSlug(oldPublicSlug));
  }
  const urls = new Set<string>([
    `${origin}/${collection}`,
    ...slugs.map((value) => `${origin}/${collection}/${value}`),
    `${origin}/sitemap.xml`,
    `${origin}/feed.xml`,
    `${origin}/llms.txt`,
  ]);
  if (urls.size > 6) {
    throw new Error("Content purge URL set exceeds the fixed boundary.");
  }
  return [...urls];
}

export function nextPurgeRetry(attemptCount: number, now: Date) {
  if (!Number.isSafeInteger(attemptCount) || attemptCount < 1) {
    throw new Error("Purge attempt count is invalid.");
  }
  const delay = RETRY_DELAYS_MS[attemptCount - 1];
  if (delay === undefined) {
    return {
      status: "failed" as const,
      nextAttemptAt: null,
    };
  }
  return {
    status: "retry" as const,
    nextAttemptAt: new Date(now.getTime() + delay),
  };
}
