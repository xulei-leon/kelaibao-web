import { redactServerError } from "@/server/config";

export interface Migration {
  version: string;
  name: string;
  statements: string[];
}

export interface MigrationConnection {
  query(sql: string, values?: unknown[]): Promise<[unknown, unknown]>;
  beginTransaction(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

const DEFAULT_LOCK_NAME = "saino_quanwang_schema_migrations";

function rowsFrom(result: unknown) {
  return Array.isArray(result) ? result : [];
}

type SchemaObject =
  | { kind: "column"; table: string; name: string }
  | { kind: "index"; table: string; name: string }
  | { kind: "constraint"; table: string; name: string };

export function schemaObjectAddedBy(statement: string): SchemaObject | null {
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
    return {
      kind: "constraint",
      table: constraint[1],
      name: constraint[2],
    };
  }
  return null;
}

export async function applyExpandOnlyStatement(
  connection: MigrationConnection,
  statement: string,
) {
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
    if (rowsFrom(existing).length > 0) return "already-applied" as const;
  }
  await connection.query(statement);
  return "applied" as const;
}

export async function runMigrations(
  connection: MigrationConnection,
  migrations: Migration[],
  {
    lockName = DEFAULT_LOCK_NAME,
    lockTimeoutSeconds = 10,
  }: { lockName?: string; lockTimeoutSeconds?: number } = {},
) {
  const [lockRows] = await connection.query(
    "SELECT GET_LOCK(?, ?) AS acquired",
    [lockName, lockTimeoutSeconds],
  );
  const acquired =
    Number((rowsFrom(lockRows)[0] as { acquired?: number } | undefined)?.acquired) ===
    1;
  if (!acquired) {
    throw new Error("Unable to acquire the MySQL migration lock.");
  }

  const appliedVersions: string[] = [];
  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(64) NOT NULL PRIMARY KEY,
        name VARCHAR(191) NOT NULL,
        applied_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);
    const [versionRows] = await connection.query(
      "SELECT version FROM schema_migrations ORDER BY version",
    );
    const applied = new Set(
      rowsFrom(versionRows).map((row) =>
        String((row as { version: string }).version),
      ),
    );

    for (const migration of [...migrations].sort((left, right) =>
      left.version.localeCompare(right.version),
    )) {
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
        appliedVersions.push(migration.version);
      } catch (error) {
        await connection.rollback();
        throw new Error(
          `Migration ${migration.version} failed: ${redactServerError(error)}`,
        );
      }
    }
  } finally {
    await connection.query("SELECT RELEASE_LOCK(?) AS released", [lockName]);
  }

  return { appliedVersions };
}
