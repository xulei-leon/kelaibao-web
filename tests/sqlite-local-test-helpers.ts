import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";

import {
  openLocalSqlite,
  resetLocalSqliteRuntimeForTests,
} from "@/server/db/sqlite/runtime";

export function createSqliteTestDatabase() {
  const localRoot = join(process.cwd(), ".local-data");
  mkdirSync(localRoot, { recursive: true });
  const directory = mkdtempSync(join(localRoot, "vitest-m4-01-"));
  const path = join(directory, "database.sqlite");
  const migration = spawnSync(process.execPath, ["scripts/sqlite-maintenance.mjs", "migrate"], {
    cwd: process.cwd(), encoding: "utf8",
    env: { ...process.env, DATABASE_ADAPTER: "sqlite", DATABASE_RUNTIME_SCOPE: "local-test", SINO_RUNTIME_MODE: "preview", DATABASE_URL: "", SQLITE_DATABASE_PATH: path, MYSQL_POOL_LIMIT: "", MYSQL_QUEUE_LIMIT: "", MYSQL_ACQUIRE_TIMEOUT_MS: "", MYSQL_MAX_APP_INSTANCES: "", MYSQL_CONNECTION_BUDGET: "" },
  });
  if (migration.status !== 0) throw new Error(`Test database migration failed: ${migration.stderr}`);
  const database = openLocalSqlite(path);
  return {
    path,
    database,
    cleanup() {
      resetLocalSqliteRuntimeForTests();
      rmSync(directory, { recursive: true, force: true });
    },
  };
}

export function seedSqliteAdmin(
  database: ReturnType<typeof openLocalSqlite>,
  passwordHash: string,
) {
  const now = new Date("2026-08-01T10:00:00.000Z").toISOString();
  const result = database.prepare(
    `INSERT INTO admins
      (username, password_hash, password_changed_at, singleton_key,
       created_at, updated_at)
     VALUES ('admin@example.test', ?, ?, 1, ?, ?)`,
  ).run(passwordHash, now, now, now);
  return Number(result.lastInsertRowid);
}
