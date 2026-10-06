import {
  existsSync,
  mkdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { DatabaseSync } from "node:sqlite";

import { afterEach, describe, expect, it } from "vitest";

import { normalizeContentDraft } from "@/server/content/domain";
import { SqliteContentRepository } from "@/server/content/sqlite-repository";
import { SqliteMediaUploadRepository } from "@/server/media/sqlite-repository";
import type { LocalSqliteDatabase } from "@/server/db/sqlite/runtime";

const created: string[] = [];
afterEach(() => {
  for (const path of created.splice(0)) rmSync(path, { recursive: true, force: true });
});

function run(operation: "migrate" | "reset", databasePath: string, extra = {}) {
  return spawnSync(
    process.execPath,
    [join(process.cwd(), "scripts", "sqlite-maintenance.mjs"), operation],
    {
      cwd: process.cwd(),
      encoding: "utf8",
      env: {
        ...process.env,
        DATABASE_ADAPTER: "sqlite",
        DATABASE_RUNTIME_SCOPE: "local-test",
        SINO_RUNTIME_MODE: "preview",
        DATABASE_URL: "",
        SQLITE_DATABASE_PATH: databasePath,
        ...extra,
      },
    },
  );
}

function runAdmin(extra = {}) {
  return spawnSync(
    process.execPath,
    [join(process.cwd(), "scripts", "admin-maintenance.mjs"), "bootstrap"],
    {
      cwd: process.cwd(),
      encoding: "utf8",
      env: {
        ...process.env,
        DATABASE_ADAPTER: "",
        DATABASE_URL: "mysql://user:password@127.0.0.1:3306/kelaibao",
        DATABASE_RUNTIME_SCOPE: "deployment",
        SQLITE_DATABASE_PATH: "",
        ...extra,
      },
    },
  );
}

describe("M4-01 SQLite maintenance path boundary", () => {
  it("bootstraps an administrator after the current migration", () => {
    const directory = join(process.cwd(), ".local-data", `bootstrap-${Date.now()}`);
    created.push(directory);
    const relativePath = `.local-data/${directory.split(/[\\/]/).pop()}/database.sqlite`;
    expect(run("migrate", relativePath).status).toBe(0);
    const result = runAdmin({ DATABASE_ADAPTER: "sqlite", DATABASE_URL: "", DATABASE_RUNTIME_SCOPE: "local-test", SINO_RUNTIME_MODE: "preview", SQLITE_DATABASE_PATH: relativePath, ADMIN_USERNAME: "cms-test@example.test", ADMIN_PASSWORD: "local-test-password-24", ADMIN_OPERATION_REASON_CODE: "LOCAL_CMS_TEST" });
    expect(result.status, result.stderr).toBe(0);
    const database = new DatabaseSync(join(directory, "database.sqlite"));
    try { expect(database.prepare("SELECT username FROM admins").get()?.username).toBe("cms-test@example.test"); }
    finally { database.close(); }
  });
  it("migrates and resets only a selected local-data sqlite file", () => {
    const directory = join(process.cwd(), ".local-data", `maintenance-${Date.now()}`);
    created.push(directory);
    const relativePath = `.local-data/${directory.split(/[\\/]/).pop()}/database.sqlite`;
    expect(run("migrate", relativePath).status).toBe(0);
    const target = join(directory, "database.sqlite");
    expect(existsSync(target)).toBe(true);
    expect(run("reset", relativePath).status).toBe(0);
    expect(existsSync(target)).toBe(false);
  });

  it("upgrades a pre-M5 version-1 database before new repositories query it", async () => {
    const directory = join(process.cwd(), ".local-data", `upgrade-${Date.now()}`);
    mkdirSync(directory, { recursive: true });
    created.push(directory);
    const target = join(directory, "database.sqlite");
    const legacy = new DatabaseSync(target);
    legacy.exec(`
      PRAGMA foreign_keys = ON;
      CREATE TABLE schema_versions (
        version INTEGER PRIMARY KEY,
        applied_at TEXT NOT NULL
      ) STRICT;
      INSERT INTO schema_versions(version, applied_at) VALUES (1, '2026-08-01T00:00:00.000Z');
      CREATE TABLE admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        singleton_key INTEGER NOT NULL DEFAULT 1 UNIQUE CHECK (singleton_key = 1),
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        failed_login_count INTEGER NOT NULL DEFAULT 0 CHECK (failed_login_count BETWEEN 0 AND 5),
        locked_until TEXT,
        disabled_at TEXT,
        last_login_at TEXT,
        password_changed_at TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      ) STRICT;
      CREATE TABLE content_revisions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content_item_id INTEGER NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
        revision_number INTEGER NOT NULL CHECK (revision_number >= 1),
        slug TEXT NOT NULL,
        title TEXT NOT NULL,
        summary TEXT NOT NULL,
        source_html TEXT NOT NULL,
        sanitized_html TEXT NOT NULL,
        sanitizer_policy_version TEXT NOT NULL,
        status TEXT NOT NULL,
        actor_admin_id INTEGER NOT NULL REFERENCES admins(id) ON DELETE RESTRICT,
        created_at TEXT NOT NULL,
        UNIQUE(content_item_id, revision_number)
      ) STRICT;
      CREATE TABLE media_assets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        object_key TEXT NOT NULL UNIQUE,
        mime_type TEXT NOT NULL,
        byte_size INTEGER NOT NULL,
        checksum_sha256 TEXT NOT NULL,
        created_by INTEGER NOT NULL REFERENCES admins(id) ON DELETE RESTRICT,
        created_at TEXT NOT NULL
      ) STRICT;
    `);
    legacy.close();

    const relativePath = `.local-data/${directory.split(/[\\/]/).pop()}/database.sqlite`;
    const migration = run("migrate", relativePath);
    expect(migration.status, migration.stderr).toBe(0);

    const database = new DatabaseSync(target);
    try {
      expect(
        database.prepare("SELECT MAX(version) AS version FROM schema_versions").get()?.version,
      ).toBe(2);
      expect(
        database.prepare("PRAGMA table_info(media_assets)").all().map((row) => row.name),
      ).toEqual(
        expect.arrayContaining([
          "width_px",
          "height_px",
          "public_usage_confirmed_at",
          "public_usage_confirmed_by",
        ]),
      );
      expect(
        database.prepare("PRAGMA table_info(content_revisions)").all().map((row) => row.name),
      ).toEqual(expect.arrayContaining(["cover_media_asset_id", "cover_alt"]));

      database.prepare(
        `INSERT INTO admins
          (singleton_key, username, password_hash, password_changed_at, created_at, updated_at)
         VALUES (1, 'admin', 'local-test', ?, ?, ?)`,
      ).run(
        "2026-08-09T00:00:00.000Z",
        "2026-08-09T00:00:00.000Z",
        "2026-08-09T00:00:00.000Z",
      );
      const asset = database.prepare(
        `INSERT INTO media_assets
          (object_key, mime_type, byte_size, checksum_sha256, width_px, height_px,
           created_by, created_at)
         VALUES ('media/1/upgrade.webp', 'image/webp', 204800, ?, 1200, 630, 1, ?)`,
      ).run("a".repeat(64), "2026-08-09T00:00:00.000Z");
      const runtime = {
        path: target,
        database: database as unknown as LocalSqliteDatabase,
      };
      await new SqliteMediaUploadRepository(runtime).confirmPublicUsage({
        mediaAssetId: Number(asset.lastInsertRowid),
        adminId: 1,
        confirmedAt: new Date("2026-08-09T01:00:00.000Z"),
        requestId: "sqlite-upgrade",
      });
      await expect(
        new SqliteContentRepository(runtime).createDraft({
          actorAdminId: 1,
          now: new Date("2026-08-09T01:00:00.000Z"),
          requestId: "sqlite-upgrade-content",
          draft: normalizeContentDraft({
            contentType: "news",
            slug: "sqlite-upgrade",
            title: "SQLite 升级",
            summary: "升级后可写入新 revision。",
            sourceHtml: "<p>正文</p>",
          }),
        }),
      ).resolves.toMatchObject({ revision: { coverMediaAssetId: null, coverAlt: null } });
    } finally {
      database.close();
    }
  });

  it("rejects an outside path without deleting the target", () => {
    const outside = join(process.cwd(), `outside-m4-01-${Date.now()}.sqlite`);
    created.push(outside);
    writeFileSync(outside, "must-stay");
    const result = run("reset", outside);
    expect(result.status).not.toBe(0);
    expect(existsSync(outside)).toBe(true);
  });

  it("rejects SQLite maintenance in production", () => {
    const directory = join(process.cwd(), ".local-data", `production-${Date.now()}`);
    mkdirSync(directory, { recursive: true });
    created.push(directory);
    const result = run(
      "migrate",
      `.local-data/${directory.split(/[\\/]/).pop()}/database.sqlite`,
      { SINO_RUNTIME_MODE: "production" },
    );
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/not allowed in production/i);
  });

  it("rejects an existing target-file symlink before opening or deleting it", ({ skip }) => {
    const directory = join(process.cwd(), ".local-data", `target-link-${Date.now()}`);
    const outside = join(process.cwd(), `outside-target-link-${Date.now()}.sqlite`);
    mkdirSync(directory, { recursive: true });
    writeFileSync(outside, "must-stay");
    const target = join(directory, "database.sqlite");
    created.push(directory, outside);
    try {
      symlinkSync(outside, target, "file");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "EPERM") return skip();
      throw error;
    }

    const result = run("reset", target);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/symlink|junction/i);
    expect(existsSync(outside)).toBe(true);
  });

  it("rejects a linked parent directory that escapes local-data", () => {
    const outsideDirectory = join(process.cwd(), `outside-parent-link-${Date.now()}`);
    const linkedDirectory = join(
      process.cwd(),
      ".local-data",
      `parent-link-${Date.now()}`,
    );
    mkdirSync(outsideDirectory, { recursive: true });
    mkdirSync(join(process.cwd(), ".local-data"), { recursive: true });
    symlinkSync(outsideDirectory, linkedDirectory, "junction");
    created.push(linkedDirectory, outsideDirectory);

    const result = run("migrate", join(linkedDirectory, "database.sqlite"));
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/symlink|junction|escapes/i);
    expect(existsSync(join(outsideDirectory, "database.sqlite"))).toBe(false);
  });

  it("rejects ambiguous admin maintenance configuration before MySQL access", () => {
    const result = runAdmin({
      SQLITE_DATABASE_PATH: ".local-data/ambiguous.sqlite",
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/DATABASE_ADAPTER=sqlite|conflicts with MySQL/i);
    expect(result.stderr).not.toMatch(/ECONNREFUSED/i);
  });

  it("rejects an unsupported admin maintenance runtime scope before MySQL access", () => {
    const result = runAdmin({ DATABASE_RUNTIME_SCOPE: "serverless" });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/DATABASE_RUNTIME_SCOPE.*deployment.*local-test/i);
    expect(result.stderr).not.toMatch(/ECONNREFUSED/i);
  });
});
