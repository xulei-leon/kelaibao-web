import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
  type BinaryLike,
} from "node:crypto";

const SESSION_DURATION_MS = 8 * 60 * 60 * 1_000;
const CSRF_CONTEXT = "saino-admin-csrf-v1";
type Environment = Record<string, string | undefined>;

export function hashToken(token: BinaryLike) {
  return createHash("sha256").update(token).digest("hex");
}

export function createSessionCredentials(
  now = new Date(),
  createRandomBytes: (size: number) => Buffer = randomBytes,
  csrfSecret: Buffer = resolveCsrfDerivationSecret(),
) {
  const sessionToken = createRandomBytes(32).toString("base64url");
  const csrf = deriveCsrfCredentials(sessionToken, csrfSecret);
  return {
    sessionToken,
    sessionTokenHash: hashToken(sessionToken),
    ...csrf,
    expiresAt: new Date(now.getTime() + SESSION_DURATION_MS),
  };
}

export function resolveCsrfDerivationSecret(
  env: Environment = process.env,
) {
  const encoded = env.ADMIN_CSRF_SECRET?.trim() ?? "";
  if (!/^[a-zA-Z0-9_-]+$/.test(encoded)) {
    throw new Error("ADMIN_CSRF_SECRET must be base64url encoded.");
  }
  const secret = Buffer.from(encoded, "base64url");
  if (secret.length < 32) {
    throw new Error("ADMIN_CSRF_SECRET must contain at least 256 bits.");
  }
  return secret;
}

export function deriveCsrfCredentials(
  sessionToken: string,
  csrfSecret: Buffer = resolveCsrfDerivationSecret(),
) {
  const csrfToken = createHmac("sha256", csrfSecret)
    .update(CSRF_CONTEXT)
    .update("\0")
    .update(sessionToken)
    .digest("base64url");
  return {
    csrfToken,
    csrfTokenHash: hashToken(csrfToken),
  };
}

export function createSessionCookie(
  sessionToken: string,
  expiresAt: Date,
  secure = true,
) {
  return [
    `saino_admin_session=${encodeURIComponent(sessionToken)}`,
    "Path=/",
    "HttpOnly",
    secure ? "Secure" : "",
    "SameSite=Strict",
    `Expires=${expiresAt.toUTCString()}`,
    `Max-Age=${Math.max(
      0,
      Math.floor((expiresAt.getTime() - Date.now()) / 1_000),
    )}`,
  ]
    .filter(Boolean)
    .join("; ");
}

export function clearSessionCookie(secure = true) {
  return [
    "saino_admin_session=",
    "Path=/",
    "HttpOnly",
    secure ? "Secure" : "",
    "SameSite=Strict",
    "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
    "Max-Age=0",
  ]
    .filter(Boolean)
    .join("; ");
}

export function tokenMatchesHash(token: string, storedHash: string) {
  const actual = Buffer.from(hashToken(token), "hex");
  const expected = Buffer.from(storedHash, "hex");
  return (
    actual.length === expected.length && timingSafeEqual(actual, expected)
  );
}

export function assertTrustedMutation({
  requestUrl,
  host,
  origin,
  allowedOrigin,
  csrfToken,
  storedCsrfTokenHash,
}: {
  requestUrl: string;
  host: string | null;
  origin: string | null;
  allowedOrigin: string;
  csrfToken: string | null;
  storedCsrfTokenHash: string;
}) {
  const url = new URL(requestUrl);
  const expected = new URL(allowedOrigin);
  if (
    url.origin !== expected.origin ||
    !host ||
    host.toLowerCase() !== expected.host.toLowerCase()
  ) {
    throw new Error("Untrusted Host for administrator mutation.");
  }
  if (!origin || new URL(origin).origin !== expected.origin) {
    throw new Error("Untrusted Origin for administrator mutation.");
  }
  if (!csrfToken || !tokenMatchesHash(csrfToken, storedCsrfTokenHash)) {
    throw new Error("Invalid CSRF token.");
  }
}
