import { createRequire } from "node:module";

import { resolveServerConfig } from "@/server/config";

type SqliteValue = null | number | string | Uint8Array;
type SqliteRow = Record<string, SqliteValue>;

interface StatementSync {
  all(...values: SqliteValue[]): SqliteRow[];
  get(...values: SqliteValue[]): SqliteRow | undefined;
  run(...values: SqliteValue[]): { changes: number; lastInsertRowid: number | bigint };
}

export interface LocalSqliteDatabase {
  close(): void;
  exec(sql: string): void;
  prepare(sql: string): StatementSync;
}

interface DatabaseSyncConstructor {
  new (path: string): LocalSqliteDatabase;
}

const load = createRequire(import.meta.url);
const globalForSqlite = globalThis as typeof globalThis & {
  kelaibaoSqliteDatabases?: Map<string, LocalSqliteDatabase>;
  kelaibaoSqliteLocks?: Map<string, Promise<void>>;
};

function databaseConstructor(): DatabaseSyncConstructor {
  try {
    return (load("node:sqlite") as { DatabaseSync: DatabaseSyncConstructor })
      .DatabaseSync;
  } catch {
    throw new Error(
      "SQLite local-test requires Node.js 22.13 or newer.",
    );
  }
}

function databases() {
  return (globalForSqlite.kelaibaoSqliteDatabases ??= new Map());
}

function locks() {
  return (globalForSqlite.kelaibaoSqliteLocks ??= new Map());
}

export function openLocalSqlite(path: string): LocalSqliteDatabase {
  const existing = databases().get(path);
  if (existing) return existing;
  const DatabaseSync = databaseConstructor();
  const database = new DatabaseSync(path);
  database.exec("PRAGMA foreign_keys = ON");
  database.exec("PRAGMA busy_timeout = 5000");
  database.exec("PRAGMA journal_mode = WAL");
  const version = database
    .prepare("SELECT MAX(version) AS version FROM schema_versions")
    .get();
  if (Number(version?.version) !== 3) {
    database.close();
    throw new Error(
      "SQLite schema is not initialized; run pnpm db:sqlite:migrate.",
    );
  }
  databases().set(path, database);
  return database;
}

export function getRuntimeSqlite() {
  const config = resolveServerConfig();
  if (config.databaseAdapter !== "sqlite" || !config.sqlite) {
    throw new Error("SQLite local-test runtime is not configured.");
  }
  return { path: config.sqlite.path, database: openLocalSqlite(config.sqlite.path) };
}

export async function withSqliteWriteTransaction<T>(
  path: string,
  database: LocalSqliteDatabase,
  callback: () => Promise<T>,
) {
  const previous = locks().get(path) ?? Promise.resolve();
  let release = () => {};
  const current = new Promise<void>((resolve) => {
    release = resolve;
  });
  const chain = previous.then(() => current);
  locks().set(path, chain);
  await previous;
  database.exec("BEGIN IMMEDIATE");
  try {
    const result = await callback();
    database.exec("COMMIT");
    return result;
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  } finally {
    release();
    if (locks().get(path) === chain) locks().delete(path);
  }
}

export function resetLocalSqliteRuntimeForTests() {
  for (const database of databases().values()) database.close();
  databases().clear();
  locks().clear();
}

export function sqliteIso(value: Date | null) {
  return value?.toISOString() ?? null;
}

export function sqliteDate(value: unknown) {
  return typeof value === "string" && value ? new Date(value) : null;
}
