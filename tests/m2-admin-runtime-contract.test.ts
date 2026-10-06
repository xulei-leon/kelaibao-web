import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("M2-02 administrator runtime contract", () => {
  it("provides protected pages, authentication, sanitization, and media routes", () => {
    for (const path of [
      "src/app/admin/layout.tsx",
      "src/app/admin/login/page.tsx",
      "src/app/admin/(protected)/layout.tsx",
      "src/app/admin/(protected)/page.tsx",
      "src/app/admin/(protected)/preview/page.tsx",
      "src/app/api/admin/auth/login/route.ts",
      "src/app/api/admin/auth/logout/route.ts",
      "src/app/api/admin/auth/session/route.ts",
      "src/app/api/admin/security/sanitize/route.ts",
      "src/app/api/admin/media/presign/route.ts",
      "src/app/api/admin/media/confirm/route.ts",
    ]) {
      expect(existsSync(join(root, path)), path).toBe(true);
    }

    const adminLayout = readFileSync(
      join(root, "src/app/admin/layout.tsx"),
      "utf8",
    );
    const protectedLayout = readFileSync(
      join(root, "src/app/admin/(protected)/layout.tsx"),
      "utf8",
    );
    const rootLayout = readFileSync(join(root, "src/app/layout.tsx"), "utf8");

    expect(adminLayout).toMatch(/robots:\s*\{\s*index:\s*false/);
    expect(adminLayout).toMatch(/follow:\s*false/);
    expect(adminLayout).toContain('id="admin-main-content"');
    expect(adminLayout).not.toMatch(
      /SiteHeader|SiteFooter|MobileContactBar|MiniProgramTrialProvider|WechatContactProvider/,
    );
    expect(protectedLayout).toMatch(/cookies\(\)/);
    expect(protectedLayout).toContain("findValidSession");
    expect(protectedLayout).toMatch(/redirect\("\/admin\/login"\)/);
    expect(rootLayout).toContain("PublicAppShell");
    expect(rootLayout).not.toMatch(/<SiteHeader|<SiteFooter|<MobileContactBar/);

    const mediaBoundary = JSON.parse(
      readFileSync(
        join(root, "deploy", "oss-media-boundary.example.json"),
        "utf8",
      ),
    ) as {
      bucketAccess: { publicRead: boolean; browserLongTermCredential: boolean };
      localStatus: string;
      realCloudStatus: string;
    };
    expect(mediaBoundary.bucketAccess).toEqual(
      expect.objectContaining({
        publicRead: false,
        browserLongTermCredential: false,
      }),
    );
    expect(mediaBoundary.localStatus).toBe("LOCAL_PASS_CONTRACT_ONLY");
    expect(mediaBoundary.realCloudStatus).toBe(
      "M2-LEGACY-01-DEFERRED",
    );
  });

  it("keeps login locking and reset/bootstrap writes transactional", () => {
    const authRepository = readFileSync(
      join(root, "src/server/auth/mysql-repository.ts"),
      "utf8",
    );
    const maintenance = readFileSync(
      join(root, "scripts/admin-maintenance.mjs"),
      "utf8",
    );
    expect(authRepository).toMatch(/FOR UPDATE/);
    expect(authRepository).toMatch(/beginTransaction/);
    expect(authRepository).toMatch(/INSERT INTO admin_sessions/);
    expect(authRepository).toMatch(/insertSecurityAudit/);
    expect(maintenance).toMatch(/GET_LOCK\('saino_admin_maintenance'/);
    expect(maintenance).toMatch(/UPDATE admin_sessions SET revoked_at/);
    expect(maintenance).toMatch(/rollback/);
  });

  it("keeps administrator login controls within narrow grid columns", () => {
    const loginForm = readFileSync(
      join(root, "src/components/admin/login-form.tsx"),
      "utf8",
    );
    expect(loginForm).toContain(
      'className="w-full min-w-0 rounded-md border',
    );
  });

  it("declares controlled operations and never introduces a generic webservice", () => {
    const packageJson = JSON.parse(
      readFileSync(join(root, "package.json"), "utf8"),
    ) as { scripts: Record<string, string> };
    expect(packageJson.scripts).toEqual(
      expect.objectContaining({
        "admin:bootstrap": expect.stringContaining("bootstrap"),
        "admin:dummy-hash": expect.stringContaining("dummy-hash"),
        "admin:reset-password": expect.stringContaining("reset-password"),
        "admin:disable": expect.stringContaining("disable"),
      }),
    );

    const ossProvider = readFileSync(
      join(root, "src/server/integrations/oss/provider.ts"),
      "utf8",
    );
    expect(ossProvider).toMatch(/\bfetch\b/);
    expect(ossProvider).not.toMatch(/webservice/i);

    const smoke = readFileSync(
      join(root, "scripts/smoke-standalone.mjs"),
      "utf8",
    );
    expect(smoke).toContain("/admin/login");
    expect(smoke).toContain('redirect: "manual"');
  });
});
