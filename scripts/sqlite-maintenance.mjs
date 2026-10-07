import { DatabaseSync } from "node:sqlite";
import { mkdirSync, readFileSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";

import {
  assertSafeExistingSqlitePath,
  resolveSqliteLocalTestPath,
  SQLITE_SIDECAR_SUFFIXES,
} from "./lib/sqlite-local-test.mjs";

const CURRENT_SCHEMA_VERSION = 3;

function statements(source) {
  return source
    .split(/\s*-- statement-breakpoint\s*/)
    .map((statement) => statement.trim())
    .filter(Boolean);
}

function hasColumn(database, table, column) {
  return database
    .prepare(`PRAGMA table_info(${table})`)
    .all()
    .some((row) => row.name === column);
}

function applySqliteUpgrade(database, source) {
  database.exec("BEGIN IMMEDIATE");
  try {
    for (const statement of statements(source)) {
      const addedColumn = statement.match(
        /^ALTER TABLE\s+([a-z_]+)\s+ADD COLUMN\s+([a-z_]+)/i,
      );
      if (
        addedColumn &&
        hasColumn(database, addedColumn[1], addedColumn[2])
      ) {
        continue;
      }
      database.exec(statement);
    }
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

function migrate() {
  const resolved = resolveSqliteLocalTestPath();
  mkdirSync(dirname(resolved.target), { recursive: true });
  const target = assertSafeExistingSqlitePath(resolved);
  const schema = readFileSync(
    join(process.cwd(), "migrations", "sqlite", "001_local_test_schema.sql"),
    "utf8",
  );
  const seoImagesUpgrade = readFileSync(
    join(process.cwd(), "migrations", "sqlite", "002_seo_images.sql"),
    "utf8",
  );
  const database = new DatabaseSync(target);
  try {
    database.exec("PRAGMA foreign_keys = ON");
    const hasSchemaVersions = Boolean(
      database
        .prepare(
          "SELECT 1 AS present FROM sqlite_master WHERE type = 'table' AND name = 'schema_versions' LIMIT 1",
        )
        .get()?.present,
    );
    const existingVersion = hasSchemaVersions
      ? Number(
          database
            .prepare("SELECT MAX(version) AS version FROM schema_versions")
            .get()?.version,
        )
      : 0;
    if (existingVersion === 1) {
      applySqliteUpgrade(database, seoImagesUpgrade);
    }
    database.exec(schema);
    const before = database
      .prepare("SELECT MAX(version) AS version FROM schema_versions")
      .get();
    const version = Number(before?.version);
    if (existingVersion === 0 && version === 1) {
      applySqliteUpgrade(database, seoImagesUpgrade);
    }
    const currentVersion = Number(database
      .prepare("SELECT MAX(version) AS version FROM schema_versions").get()?.version);
    if (currentVersion === 2) {
      applySqliteUpgrade(database, readFileSync(
        join(process.cwd(), "migrations", "sqlite", "003_news_soft_delete.sql"), "utf8",
      ));
    }
    const after = database
      .prepare("SELECT MAX(version) AS version FROM schema_versions")
      .get();
    if (Number(after?.version) !== CURRENT_SCHEMA_VERSION) {
      throw new Error("SQLite schema version mismatch.");
    }
  } finally {
    database.close();
  }
  console.log("SQLite local-test schema is ready.");
}

function reset() {
  const resolved = resolveSqliteLocalTestPath();
  const target = assertSafeExistingSqlitePath(resolved);
  for (const suffix of SQLITE_SIDECAR_SUFFIXES) {
    rmSync(`${target}${suffix}`, { force: true });
  }
  console.log("SQLite local-test database was reset.");
}

const operation = process.argv[2];
if (operation === "migrate") migrate();
else if (operation === "reset") reset();
else throw new Error("SQLite operation must be migrate or reset.");
