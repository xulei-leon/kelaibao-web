import {
  authenticateAdmin,
  GENERIC_LOGIN_FAILURE,
  type AdminAuthRecord,
  type AuthRepository,
  type LockedAdminTransaction,
  type PasswordHasher,
} from "@/server/auth/service";
import {
  assertTrustedMutation,
  createSessionCookie,
  createSessionCredentials,
  deriveCsrfCredentials,
} from "@/server/auth/session";
import {
  assertAdminPassword,
  hashAdminPassword,
  needsAdminPasswordRehash,
  resolveArgon2Config,
  verifyAdminPassword,
} from "@/server/auth/password";
import { redactServerError } from "@/server/config";
import { describe, expect, it, vi } from "vitest";

function serialRepository(initial: AdminAuthRecord): AuthRepository & {
  read(): AdminAuthRecord;
  audit: string[];
} {
  let admin = { ...initial };
  let queue = Promise.resolve();
  const audit: string[] = [];

  return {
    audit,
    read: () => ({ ...admin }),
    async withLockedAdmin(_username, callback) {
      let release: () => void = () => undefined;
      const previous = queue;
      queue = new Promise<void>((resolve) => {
        release = resolve;
      });
      await previous;
      try {
        const transaction: LockedAdminTransaction = {
          admin: { ...admin },
          async recordFailure(state, event) {
            admin = { ...admin, ...state };
            audit.push(event.action);
          },
          async recordSuccess(session, replacementPasswordHash, event) {
            admin = {
              ...admin,
              passwordHash: replacementPasswordHash ?? admin.passwordHash,
              failedLoginCount: 0,
              failedLoginWindowStartedAt: null,
              lockedUntil: null,
            };
            expect(session.sessionTokenHash).toHaveLength(64);
            expect(session.csrfTokenHash).toHaveLength(64);
            audit.push(event.action);
          },
        };
        return await callback(transaction);
      } finally {
        release();
      }
    },
    async recordSecurityAudit(event) {
      audit.push(event.action);
    },
  };
}

const passwordHasher: PasswordHasher = {
  verify: vi.fn(async (hash, password) => hash === `hash:${password}`),
  needsRehash: vi.fn(() => false),
  hash: vi.fn(async (password) => `hash:${password}`),
};
const csrfSecret = Buffer.alloc(32, 9);

const baseAdmin: AdminAuthRecord = {
  id: 1,
  username: "admin",
  passwordHash: "hash:correct horse battery staple",
  failedLoginCount: 0,
  failedLoginWindowStartedAt: null,
  lockedUntil: null,
  disabledAt: null,
};

describe("M2-02 authentication security", () => {
  it("atomically locks the fifth concurrent failure without changing external errors", async () => {
    const repository = serialRepository(baseAdmin);
    const now = new Date("2026-07-30T00:00:00.000Z");

    const attempts = await Promise.all(
      Array.from({ length: 5 }, (_, index) =>
        authenticateAdmin({
          username: "admin",
          password: `wrong-${index}`,
          repository,
          passwordHasher,
          dummyPasswordHash: "hash:dummy",
          csrfSecret,
          now,
          requestId: `req-${index}`,
        }),
      ),
    );

    expect(attempts).toEqual(
      Array.from({ length: 5 }, () => ({
        ok: false,
        status: 401,
        message: GENERIC_LOGIN_FAILURE,
      })),
    );
    expect(repository.read().failedLoginCount).toBe(5);
    expect(repository.read().lockedUntil?.toISOString()).toBe(
      "2026-07-30T00:30:00.000Z",
    );
    expect(repository.audit).toContain("login_locked");
  });

  it("uses the dummy hash for unknown and locked users while keeping one response", async () => {
    const verify = vi.fn(async () => false);
    const missingRepository: AuthRepository = {
      async withLockedAdmin() {
        return null;
      },
      async recordSecurityAudit() {},
    };

    const missing = await authenticateAdmin({
      username: "missing",
      password: "guess",
      repository: missingRepository,
      passwordHasher: {
        verify,
        needsRehash: () => false,
        hash: async () => "unused",
      },
      csrfSecret,
      dummyPasswordHash: "dummy-phc",
      now: new Date("2026-07-30T00:00:00.000Z"),
      requestId: "missing-1",
    });
    expect(verify).toHaveBeenCalledWith("dummy-phc", "guess");
    expect(missing).toEqual({
      ok: false,
      status: 401,
      message: GENERIC_LOGIN_FAILURE,
    });
  });

  it("creates 256-bit session and CSRF tokens and rejects cross-site mutations", () => {
    const credentials = createSessionCredentials(
      new Date("2026-07-30T00:00:00.000Z"),
      () => Buffer.alloc(32, 7),
      csrfSecret,
    );
    expect(Buffer.from(credentials.sessionToken, "base64url")).toHaveLength(32);
    expect(Buffer.from(credentials.csrfToken, "base64url")).toHaveLength(32);
    expect(credentials.expiresAt.toISOString()).toBe(
      "2026-07-30T08:00:00.000Z",
    );
    const cookie = createSessionCookie(
      credentials.sessionToken,
      credentials.expiresAt,
    );
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Secure");
    expect(cookie).toContain("SameSite=Strict");
    expect(cookie).toContain("Path=/");

    expect(() =>
      assertTrustedMutation({
        requestUrl: "https://www.example.cn/api/admin/media/presign",
        host: "www.example.cn",
        origin: "https://evil.example",
        allowedOrigin: "https://www.example.cn",
        csrfToken: credentials.csrfToken,
        storedCsrfTokenHash: credentials.csrfTokenHash,
      }),
    ).toThrow(/origin/i);

    expect(() =>
      assertTrustedMutation({
        requestUrl: "https://www.example.cn/api/admin/media/presign",
        host: "www.example.cn",
        origin: "https://www.example.cn",
        allowedOrigin: "https://www.example.cn",
        csrfToken: "forged",
        storedCsrfTokenHash: credentials.csrfTokenHash,
      }),
    ).toThrow(/csrf/i);

    expect(() =>
      assertTrustedMutation({
        requestUrl: "https://www.example.cn/api/admin/media/presign",
        host: "www.example.cn",
        origin: "https://www.example.cn",
        allowedOrigin: "https://www.example.cn",
        csrfToken: credentials.csrfToken,
        storedCsrfTokenHash: credentials.csrfTokenHash,
      }),
    ).not.toThrow();

    expect(() =>
      assertTrustedMutation({
        requestUrl: "https://fc-internal.example/api/admin/media/presign",
        host: "fc-internal.example",
        origin: "https://fc-internal.example",
        allowedOrigin: "https://www.example.cn",
        csrfToken: credentials.csrfToken,
        storedCsrfTokenHash: credentials.csrfTokenHash,
      }),
    ).toThrow(/host/i);

    const tabOne = deriveCsrfCredentials(
      credentials.sessionToken,
      csrfSecret,
    );
    const tabTwo = deriveCsrfCredentials(
      credentials.sessionToken,
      csrfSecret,
    );
    expect(tabTwo).toEqual(tabOne);
    for (const tab of [tabTwo, tabOne]) {
      expect(() =>
        assertTrustedMutation({
          requestUrl: "https://www.example.cn/api/admin/media/presign",
          host: "www.example.cn",
          origin: "https://www.example.cn",
          allowedOrigin: "https://www.example.cn",
          csrfToken: tab.csrfToken,
          storedCsrfTokenHash: credentials.csrfTokenHash,
        }),
      ).not.toThrow();
    }
  });

  it("upgrades an outdated Argon2 hash inside successful login and leaves current hashes unchanged", async () => {
    const outdatedRepository = serialRepository(baseAdmin);
    const outdatedHasher: PasswordHasher = {
      verify: vi.fn(async () => true),
      needsRehash: vi.fn(() => true),
      hash: vi.fn(async () => "hash:upgraded"),
    };
    await expect(
      authenticateAdmin({
        username: "admin",
        password: "correct horse battery staple",
        repository: outdatedRepository,
        passwordHasher: outdatedHasher,
        dummyPasswordHash: "hash:dummy",
        csrfSecret,
        now: new Date("2026-07-30T00:00:00.000Z"),
        requestId: "rehash-1",
      }),
    ).resolves.toMatchObject({ ok: true });
    expect(outdatedRepository.read().passwordHash).toBe("hash:upgraded");

    const currentRepository = serialRepository(baseAdmin);
    await expect(
      authenticateAdmin({
        username: "admin",
        password: "correct horse battery staple",
        repository: currentRepository,
        passwordHasher,
        dummyPasswordHash: "hash:dummy",
        csrfSecret,
        now: new Date("2026-07-30T00:00:00.000Z"),
        requestId: "rehash-2",
      }),
    ).resolves.toMatchObject({ ok: true });
    expect(currentRepository.read().passwordHash).toBe(
      baseAdmin.passwordHash,
    );
    expect(passwordHasher.hash).not.toHaveBeenCalled();
  });

  it("enforces Argon2id limits and verifies PHC hashes", async () => {
    expect(() => assertAdminPassword("short")).toThrow(/14/);
    expect(() =>
      resolveArgon2Config({ ARGON2_MEMORY_COST_KIB: "1024" }),
    ).toThrow(/memory/i);

    const config = resolveArgon2Config({});
    const hash = await hashAdminPassword(
      "correct horse battery staple",
      config,
    );
    expect(hash).toMatch(/^\$argon2id\$/);
    await expect(
      verifyAdminPassword(hash, "correct horse battery staple"),
    ).resolves.toBe(true);
    expect(needsAdminPasswordRehash(hash, config)).toBe(false);
  });

  it("redacts authentication and OSS signing material from server errors", () => {
    const redacted = redactServerError(
      new Error(
        "https://oss.example/object?OSSAccessKeyId=temporary-id&Signature=signed-value&security-token=sts-token ADMIN_PASSWORD=admin-secret OSS_STS_ACCESS_KEY_SECRET=oss-secret csrfToken=csrf-secret sessionToken=session-secret nonce=nonce-secret",
      ),
    );

    expect(redacted).not.toMatch(
      /temporary-id|signed-value|sts-token|admin-secret|oss-secret|csrf-secret|session-secret|nonce-secret/,
    );
  });
});
