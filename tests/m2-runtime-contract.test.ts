import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { GET as getHealth } from "@/app/api/health/route";
import nextConfig from "../next.config";
import { describe, expect, it } from "vitest";

const projectRoot = process.cwd();

describe("M2 full-stack runtime contract", () => {
  it("builds a standalone server and disables shared caching for admin and API paths", async () => {
    expect(nextConfig.output).toBe("standalone");
    expect(nextConfig).not.toHaveProperty("trailingSlash");

    const rules = await nextConfig.headers?.();
    expect(rules).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ source: "/admin/:path*" }),
        expect.objectContaining({ source: "/api/:path*" }),
      ]),
    );
    for (const rule of (rules ?? []).filter((candidate) =>
      ["/admin/:path*", "/api/:path*", "/health"].includes(candidate.source),
    )) {
      expect(rule.headers).toEqual(
        expect.arrayContaining([
          { key: "Cache-Control", value: "private, no-store, max-age=0" },
        ]),
      );
    }
    expect(rules).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: "/visual/generated/:path*",
          headers: [
            {
              key: "Cache-Control",
              value: "public, max-age=31536000, immutable",
            },
          ],
        }),
      ]),
    );
  });

  it("declares migration, packaging, standalone start, and smoke commands", () => {
    const packageJson = JSON.parse(
      readFileSync(join(projectRoot, "package.json"), "utf8"),
    ) as { scripts: Record<string, string>; engines?: { node?: string } };

    expect(packageJson.engines?.node).toMatch(/20/);
    expect(packageJson.scripts).toEqual(
      expect.objectContaining({
        "db:migrate": expect.stringContaining("scripts/migrate.mjs"),
        "package:standalone": expect.stringContaining(
          "scripts/package-standalone.mjs",
        ),
        "start:standalone": expect.stringContaining(
          ".next/standalone/server.js",
        ),
        "smoke:standalone": expect.stringContaining(
          "scripts/smoke-standalone.mjs",
        ),
      }),
    );
  });

  it("repairs Windows directory symlinks in the local standalone artifact", () => {
    const packagingScript = readFileSync(
      join(projectRoot, "scripts", "package-standalone.mjs"),
      "utf8",
    );

    expect(packagingScript).toMatch(/process\.platform\s*!==\s*"win32"/);
    expect(packagingScript).toMatch(/\breadlink\(/);
    expect(packagingScript).toMatch(/\bsymlink\([^;]+,\s*"dir"\)/s);
  });

  it("versions local FC observability placeholders without claiming cloud activation", () => {
    const fcRuntime = JSON.parse(
      readFileSync(
        join(projectRoot, "deploy", "fc-runtime.example.json"),
        "utf8",
      ),
    ) as {
      observability: {
        applicationLogs: { structured: boolean; redactSecrets: boolean };
        alarms: Array<{ metric: string; status: string }>;
      };
    };

    expect(fcRuntime.observability.applicationLogs).toEqual({
      structured: true,
      redactSecrets: true,
    });
    expect(fcRuntime.observability.alarms).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          metric: "http_5xx_rate",
          status: "M2-LEGACY-01-DEFERRED",
        }),
        expect.objectContaining({
          metric: "http_p95_latency_ms",
          status: "M2-LEGACY-01-DEFERRED",
        }),
      ]),
    );
  });

  it("provides all six expand-only MySQL core tables", () => {
    const migrationPath = join(
      projectRoot,
      "migrations",
      "001_core_schema.sql",
    );
    expect(existsSync(migrationPath)).toBe(true);
    const sql = readFileSync(migrationPath, "utf8");

    for (const table of [
      "admins",
      "admin_sessions",
      "content_items",
      "content_revisions",
      "media_assets",
      "audit_logs",
    ]) {
      expect(sql).toMatch(
        new RegExp(`CREATE TABLE IF NOT EXISTS ${table}\\b`, "i"),
      );
    }
    expect(sql).toMatch(/ENGINE=InnoDB/);
    expect(sql).toMatch(/utf8mb4/);
    expect(sql).not.toMatch(/\b(DROP|RENAME)\b/i);

    const normalizedSql = sql.replace(/\s+/g, " ");
    expect(normalizedSql).toContain(
      "UNIQUE KEY uq_content_items_type_slug (content_type, slug)",
    );
    expect(normalizedSql).toContain(
      "CONSTRAINT chk_admin_sessions_expiry CHECK (expires_at > created_at)",
    );
    expect(normalizedSql).toContain(
      "CONSTRAINT chk_content_revisions_number CHECK (revision_number >= 1)",
    );
    expect(normalizedSql).toContain(
      "CONSTRAINT chk_media_assets_size CHECK (byte_size > 0 AND byte_size <= 10485760)",
    );
    expect(normalizedSql).toContain(
      "CONSTRAINT chk_admins_failed_login_count CHECK (failed_login_count <= 5)",
    );
    expect(normalizedSql).toMatch(
      /CONSTRAINT chk_content_items_case_authorization CHECK \( \( content_type <> 'case' AND case_authorization_confirmed_at IS NULL AND case_authorization_admin_id IS NULL \) OR \( content_type = 'case' AND \( \( status <> 'published' AND case_authorization_confirmed_at IS NULL AND case_authorization_admin_id IS NULL \) OR \( case_authorization_confirmed_at IS NOT NULL AND case_authorization_admin_id IS NOT NULL \) \) \) \)/,
    );
  });

  it("returns a no-store health response without secrets", async () => {
    const response = await getHealth();
    const body = await response.json();

    expect(response.headers.get("cache-control")).toBe(
      "private, no-store, max-age=0",
    );
    expect(body).toEqual(
      expect.objectContaining({
        status: "ok",
        contentSource: "static",
      }),
    );
    expect(JSON.stringify(body)).not.toMatch(/password|DATABASE_URL/i);
  });
});
