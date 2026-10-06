import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";

import mysql from "mysql2/promise";

function redact(error) {
  const message = error instanceof Error ? error.message : String(error);
  return message
    .replace(/mysql:\/\/[^\s]+/gi, "mysql://[REDACTED]")
    .replace(
      /\b(password|authorization|cookie)\s*[:=]\s*[^\s,;]+/gi,
      "$1=[REDACTED]",
    );
}

function positiveInteger(name, fallback) {
  const raw = process.env[name]?.trim();
  const value = raw ? Number(raw) : fallback;
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new Error(`${name} must be a positive integer.`);
  }
  return value;
}

async function loadMigrations() {
  const directory = resolve(process.cwd(), "migrations");
  const files = (await readdir(directory))
    .filter((file) => /^\d+_.+\.sql$/.test(file))
    .sort();
  return Promise.all(
    files.map(async (file) => {
      const [version, ...nameParts] = file.replace(/\.sql$/, "").split("_");
      const source = await readFile(resolve(directory, file), "utf8");
      const statements = source
        .split(/^\s*-- statement-breakpoint\s*$/m)
        .map((statement) => statement.trim())
        .filter(Boolean);
      return { version, name: nameParts.join("_"), statements };
    }),
  );
}

function schemaObjectAddedBy(statement) {
  const normalized = statement.trim();
  const column = normalized.match(
    /^ALTER\s+TABLE\s+`?([a-zA-Z0-9_]+)`?\s+ADD\s+COLUMN\s+`?([a-zA-Z0-9_]+)`?/i,
  );
  if (column) {
    return { kind: "column", table: column[1], name: column[2] };
  }
  const index = normalized.match(
    /^ALTER\s+TABLE\s+`?([a-zA-Z0-9_]+)`?\s+ADD\s+(?:UNIQUE\s+)?(?:KEY|INDEX)\s+`?([a-zA-Z0-9_]+)`?/i,
  );
  if (index) {
    return { kind: "index", table: index[1], name: index[2] };
  }
  const constraint = normalized.match(
    /^ALTER\s+TABLE\s+`?([a-zA-Z0-9_]+)`?\s+ADD\s+CONSTRAINT\s+`?([a-zA-Z0-9_]+)`?/i,
  );
  if (constraint) {
    return { kind: "constraint", table: constraint[1], name: constraint[2] };
  }
  return null;
}

async function applyExpandOnlyStatement(connection, statement) {
  const object = schemaObjectAddedBy(statement);
  if (object) {
    const source =
      object.kind === "column"
        ? { table: "COLUMNS", field: "COLUMN_NAME" }
        : object.kind === "index"
          ? { table: "STATISTICS", field: "INDEX_NAME" }
          : { table: "TABLE_CONSTRAINTS", field: "CONSTRAINT_NAME" };
    const [existing] = await connection.query(
      `SELECT 1 AS present
         FROM INFORMATION_SCHEMA.${source.table}
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = ?
          AND ${source.field} = ?
        LIMIT 1`,
      [object.table, object.name],
    );
    if (existing.length > 0) return;
  }
  await connection.query(statement);
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl?.startsWith("mysql://")) {
    throw new Error("DATABASE_URL must be configured with mysql://.");
  }
  const lockName =
    process.env.MYSQL_MIGRATION_LOCK_NAME ??
    "saino_quanwang_schema_migrations";
  const lockTimeout = positiveInteger(
    "MYSQL_MIGRATION_LOCK_TIMEOUT_SECONDS",
    10,
  );
  const pool = mysql.createPool({
    uri: databaseUrl,
    connectionLimit: 1,
    queueLimit: 1,
    waitForConnections: true,
    multipleStatements: false,
    charset: "utf8mb4",
    timezone: "Z",
  });
  const connection = await pool.getConnection();
  let acquired = false;

  try {
    await connection.query(
      "SET SESSION sql_mode = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION'",
    );
    await connection.query("SET time_zone = '+00:00'");
    const [lockRows] = await connection.query(
      "SELECT GET_LOCK(?, ?) AS acquired",
      [lockName, lockTimeout],
    );
    acquired = Number(lockRows[0]?.acquired) === 1;
    if (!acquired) throw new Error("Unable to acquire migration lock.");

    await connection.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(64) NOT NULL PRIMARY KEY,
        name VARCHAR(191) NOT NULL,
        applied_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);
    const [rows] = await connection.query(
      "SELECT version FROM schema_migrations ORDER BY version",
    );
    const applied = new Set(rows.map(({ version }) => String(version)));
    const completed = [];

    for (const migration of await loadMigrations()) {
      if (applied.has(migration.version)) continue;
      await connection.beginTransaction();
        try {
          for (const statement of migration.statements) {
            await applyExpandOnlyStatement(connection, statement);
          }
        await connection.query(
          "INSERT INTO schema_migrations (version, name) VALUES (?, ?)",
          [migration.version, migration.name],
        );
        await connection.commit();
        completed.push(migration.version);
      } catch (error) {
        await connection.rollback();
        throw error;
      }
    }

    console.log(
      completed.length
        ? `Applied migration versions: ${completed.join(", ")}`
        : "No pending migrations.",
    );
  } finally {
    if (acquired) {
      await connection.query("SELECT RELEASE_LOCK(?)", [lockName]);
    }
    connection.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(`Migration stopped: ${redact(error)}`);
  process.exitCode = 1;
});
