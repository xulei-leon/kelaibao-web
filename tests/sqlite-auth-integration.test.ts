import { afterEach, describe, expect, it } from "vitest";

import { SqliteAuthRepository } from "@/server/auth/sqlite-repository";
import {
  hashAdminPassword,
  needsAdminPasswordRehash,
  verifyAdminPassword,
} from "@/server/auth/password";
import { authenticateAdmin } from "@/server/auth/service";
import {
  createSqliteTestDatabase,
  seedSqliteAdmin,
} from "./sqlite-local-test-helpers";

const cleanups: Array<() => void> = [];

afterEach(() => {
  while (cleanups.length) cleanups.pop()?.();
});

describe("M4-01 SQLite authentication integration", () => {
  it("persists login, session, logout, and security audit state", async () => {
    const runtime = createSqliteTestDatabase();
    cleanups.push(runtime.cleanup);
    const password = "LocalOnlyAdminPassword_2026";
    seedSqliteAdmin(runtime.database, await hashAdminPassword(password));
    const repository = new SqliteAuthRepository(runtime);
    const csrfSecret = Buffer.alloc(32, 7);
    const now = new Date("2026-08-01T10:05:00.000Z");

    const result = await authenticateAdmin({
      username: "ADMIN@example.test",
      password,
      repository,
      passwordHasher: {
        verify: verifyAdminPassword,
        needsRehash: needsAdminPasswordRehash,
        hash: hashAdminPassword,
      },
      dummyPasswordHash: await hashAdminPassword("DummyPassword_2026_only"),
      csrfSecret,
      now,
      requestId: "sqlite-login",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("Expected SQLite login to succeed.");
    const session = await repository.findValidSession(result.sessionToken, now);
    expect(session).toEqual(expect.objectContaining({ username: "admin@example.test" }));
    if (!session) throw new Error("Expected SQLite session.");
    await repository.revokeSession(session, "sqlite-logout", now);
    expect(await repository.findValidSession(result.sessionToken, now)).toBeNull();

    const audits = runtime.database.prepare(
      "SELECT action, metadata_json FROM audit_logs ORDER BY id",
    ).all();
    expect(audits.map((row) => row.action)).toEqual(["login_success", "logout"]);
    expect(JSON.stringify(audits)).not.toContain(password);
  });

  it("serializes five concurrent failures into one deterministic lock", async () => {
    const runtime = createSqliteTestDatabase();
    cleanups.push(runtime.cleanup);
    const encoded = await hashAdminPassword("CorrectLocalPassword_2026");
    seedSqliteAdmin(runtime.database, encoded);
    const repository = new SqliteAuthRepository(runtime);
    const dummy = await hashAdminPassword("DummyPassword_2026_only");
    const now = new Date("2026-08-01T10:10:00.000Z");

    await Promise.all(
      Array.from({ length: 5 }, (_, index) =>
        authenticateAdmin({
          username: "admin@example.test",
          password: `WrongPassword_2026_${index}`,
          repository,
          passwordHasher: {
            verify: verifyAdminPassword,
            needsRehash: needsAdminPasswordRehash,
            hash: hashAdminPassword,
          },
          dummyPasswordHash: dummy,
          csrfSecret: Buffer.alloc(32, 9),
          now,
          requestId: `sqlite-failure-${index}`,
        }),
      ),
    );

    const admin = runtime.database.prepare(
      "SELECT failed_login_count, locked_until FROM admins LIMIT 1",
    ).get();
    expect(admin?.failed_login_count).toBe(5);
    expect(new Date(String(admin?.locked_until)).getTime()).toBeGreaterThan(now.getTime());
    expect(runtime.database.prepare(
      "SELECT COUNT(*) AS count FROM audit_logs WHERE action IN ('login_failed', 'login_locked')",
    ).get()?.count).toBe(5);
  });
});
