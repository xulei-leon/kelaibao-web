import { afterEach, describe, expect, it, vi } from "vitest";

import { POST as login } from "@/app/api/admin/auth/login/route";
import { GET as session } from "@/app/api/admin/auth/session/route";
import { POST as createContent } from "@/app/api/admin/content/route";
import { hashAdminPassword } from "@/server/auth/password";
import {
  createSqliteTestDatabase,
  seedSqliteAdmin,
} from "./sqlite-local-test-helpers";

const cleanups: Array<() => void> = [];

afterEach(() => {
  vi.unstubAllEnvs();
  while (cleanups.length) cleanups.pop()?.();
});

describe("M4-01 SQLite admin HTTP flow", () => {
  it("logs in over local HTTP and writes CMS content through selected repositories", async () => {
    const runtime = createSqliteTestDatabase();
    cleanups.push(runtime.cleanup);
    const password = "LocalAdminFlowPassword_2026";
    seedSqliteAdmin(runtime.database, await hashAdminPassword(password));
    vi.stubEnv("SINO_RUNTIME_MODE", "preview");
    vi.stubEnv("DATABASE_ADAPTER", "sqlite");
    vi.stubEnv("DATABASE_RUNTIME_SCOPE", "local-test");
    vi.stubEnv("SQLITE_DATABASE_PATH", runtime.path);
    vi.stubEnv("DATABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000");
    vi.stubEnv("ADMIN_CSRF_SECRET", Buffer.alloc(32, 3).toString("base64url"));
    vi.stubEnv(
      "ADMIN_DUMMY_PASSWORD_HASH",
      await hashAdminPassword("DummyAdminFlowPassword_2026"),
    );

    const loginResponse = await login(new Request("http://localhost:3000/api/admin/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json", host: "localhost:3000" },
      body: JSON.stringify({ username: "admin@example.test", password }),
    }));
    expect(loginResponse.status).toBe(200);
    const setCookie = loginResponse.headers.get("set-cookie") ?? "";
    expect(setCookie).not.toContain("Secure");
    const cookie = setCookie.split(";", 1)[0];

    const sessionResponse = await session(new Request("http://localhost:3000/api/admin/auth/session", {
      headers: { cookie, host: "localhost:3000" },
    }));
    expect(sessionResponse.status).toBe(200);
    const sessionBody = await sessionResponse.json() as { csrfToken: string };

    const contentResponse = await createContent(new Request("http://localhost:3000/api/admin/content", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie,
        host: "localhost:3000",
        origin: "http://localhost:3000",
        "x-csrf-token": sessionBody.csrfToken,
      },
      body: JSON.stringify({
        contentType: "news",
        slug: "route-level-sqlite-news",
        title: "SQLite 路由级测试",
        summary: "通过真实 Route Handler 和 repository factory 写入。",
        sourceHtml: "<p>本地 SQLite 后台可用。</p>",
      }),
    }));
    expect(contentResponse.status).toBe(201);
    expect(await contentResponse.json()).toEqual(expect.objectContaining({ ok: true }));
    expect(runtime.database.prepare("SELECT COUNT(*) AS count FROM content_items").get()?.count)
      .toBe(1);
  });
});

