import { randomUUID } from "node:crypto";

import type { AdminRepository } from "@/server/auth/repository";
import { createAuthRepository } from "@/server/db/repository-factory";
import { assertTrustedMutation } from "@/server/auth/session";
import { resolveSiteUrl } from "@/lib/site-config";

const SESSION_COOKIE_NAME = "saino_admin_session";

function cookies(header: string | null) {
  const values = new Map<string, string>();
  for (const part of header?.split(";") ?? []) {
    const separator = part.indexOf("=");
    if (separator < 0) continue;
    const name = part.slice(0, separator).trim();
    const value = part.slice(separator + 1).trim();
    if (name) values.set(name, decodeURIComponent(value));
  }
  return values;
}

export function sessionTokenFromRequest(request: Request) {
  return cookies(request.headers.get("cookie")).get(SESSION_COOKIE_NAME) ?? null;
}

export function requestIdFromRequest(request: Request) {
  const supplied = request.headers.get("x-request-id")?.trim();
  return supplied && /^[a-zA-Z0-9._-]{1,64}$/.test(supplied)
    ? supplied
    : randomUUID();
}

export async function authenticateAdminSession(
  request: Request,
  repository: AdminRepository = createAuthRepository(),
) {
  const token = sessionTokenFromRequest(request);
  if (!token) return null;
  return repository.findValidSession(token);
}

export async function requireAdminMutation(
  request: Request,
  repository: AdminRepository = createAuthRepository(),
) {
  const session = await authenticateAdminSession(request, repository);
  if (!session) throw new Error("Administrator authentication required.");
  assertTrustedMutation({
    requestUrl: request.url,
    host: request.headers.get("host"),
    origin: request.headers.get("origin"),
    allowedOrigin: resolveSiteUrl(),
    csrfToken: request.headers.get("x-csrf-token"),
    storedCsrfTokenHash: session.csrfTokenHash,
  });
  return session;
}
