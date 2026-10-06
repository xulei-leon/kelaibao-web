import { timingSafeEqual } from "node:crypto";

import { resolveSiteUrl } from "@/lib/site-config";

type Environment = Record<string, string | undefined>;

export function assertPurgeWorkerRequest(
  request: Request,
  env: Environment = process.env,
) {
  const expected = env.PURGE_WORKER_TOKEN?.trim();
  if (!expected || expected.length < 32) {
    throw new Error("Purge worker identity is not configured.");
  }
  const site = new URL(resolveSiteUrl(env.NEXT_PUBLIC_SITE_URL));
  const requestUrl = new URL(request.url);
  if (
    requestUrl.origin !== site.origin ||
    request.headers.get("host") !== site.host
  ) {
    throw new Error("Purge worker host is not canonical.");
  }
  const authorization = request.headers.get("authorization") ?? "";
  const prefix = "Bearer ";
  const supplied = authorization.startsWith(prefix)
    ? authorization.slice(prefix.length)
    : "";
  const expectedBytes = Buffer.from(expected);
  const suppliedBytes = Buffer.from(supplied);
  if (
    expectedBytes.length !== suppliedBytes.length ||
    !timingSafeEqual(expectedBytes, suppliedBytes)
  ) {
    throw new Error("Purge worker authentication failed.");
  }
}
