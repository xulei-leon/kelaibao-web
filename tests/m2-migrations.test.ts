import {
  runMigrations,
  type Migration,
  type MigrationConnection,
} from "@/server/db/migrations";
import { describe, expect, it, vi } from "vitest";

const migrations: Migration[] = [
  {
    version: "001",
    name: "core",
    statements: ["CREATE TABLE IF NOT EXISTS admins (id BIGINT)"],
  },
  {
    version: "002",
    name: "indexes",
    statements: ["ALTER TABLE admins ADD INDEX idx_admins_id (id)"],
  },
];

function createConnection(
  options: {
    applied?: string[];
    lock?: number;
    failOn?: string;
    existingSchemaObjects?: string[];
  } = {},
) {
  const calls: string[] = [];
  const applied = options.applied ?? [];
  const connection: MigrationConnection = {
    async query(sql, values) {
      calls.push(sql);
      if (sql.includes("GET_LOCK")) {
        return [[{ acquired: options.lock ?? 1 }], []];
      }
      if (sql.includes("SELECT version FROM schema_migrations")) {
        return [applied.map((version) => ({ version })), []];
      }
      if (sql.includes("INFORMATION_SCHEMA")) {
        const name = String(values?.[1] ?? "");
        return [
          options.existingSchemaObjects?.includes(name)
            ? [{ present: 1 }]
            : [],
          [],
        ];
      }
      if (options.failOn && sql.includes(options.failOn)) {
        throw new Error("migration failed with password=secret");
      }
      return [[], []];
    },
    beginTransaction: vi.fn(async () => {
      calls.push("BEGIN");
    }),
    commit: vi.fn(async () => {
      calls.push("COMMIT");
    }),
    rollback: vi.fn(async () => {
      calls.push("ROLLBACK");
    }),
  };
  return { connection, calls };
}

describe("M2 migration runner", () => {
  it("acquires one advisory lock, applies pending migrations in order, and releases it", async () => {
    const { connection, calls } = createConnection({ applied: ["001"] });

    const result = await runMigrations(connection, migrations);

    expect(result.appliedVersions).toEqual(["002"]);
    expect(calls.filter((call) => call.includes("GET_LOCK"))).toHaveLength(1);
    expect(calls).toContain("ALTER TABLE admins ADD INDEX idx_admins_id (id)");
    expect(calls.some((call) => call.includes("RELEASE_LOCK"))).toBe(true);
  });

  it("fails closed when another release owns the migration lock", async () => {
    const { connection, calls } = createConnection({ lock: 0 });

    await expect(runMigrations(connection, migrations)).rejects.toThrow(
      /migration lock/i,
    );
    expect(calls.some((call) => call.includes("CREATE TABLE"))).toBe(false);
  });

  it("rolls back the version record, stops later migrations, and releases the lock on failure", async () => {
    const { connection, calls } = createConnection({
      failOn: "CREATE TABLE IF NOT EXISTS admins",
    });

    await expect(runMigrations(connection, migrations)).rejects.toThrow(
      /migration failed/i,
    );
    expect(calls).toContain("ROLLBACK");
    expect(calls.some((call) => call.includes("idx_admins_id"))).toBe(false);
    expect(calls.some((call) => call.includes("RELEASE_LOCK"))).toBe(true);
  });

  it("retries safely after MySQL implicitly committed an earlier expand-only DDL", async () => {
    const retryable: Migration[] = [
      {
        version: "002",
        name: "security",
        statements: [
          "ALTER TABLE admins ADD COLUMN singleton_key TINYINT NOT NULL",
          "ALTER TABLE admins ADD COLUMN disabled_at DATETIME(6) NULL",
        ],
      },
    ];
    const { connection, calls } = createConnection({
      existingSchemaObjects: ["singleton_key"],
    });

    await expect(runMigrations(connection, retryable)).resolves.toEqual({
      appliedVersions: ["002"],
    });
    expect(
      calls.filter(
        (call) =>
          call ===
          "ALTER TABLE admins ADD COLUMN singleton_key TINYINT NOT NULL",
      ),
    ).toHaveLength(0);
    expect(calls).toContain(
      "ALTER TABLE admins ADD COLUMN disabled_at DATETIME(6) NULL",
    );
    expect(
      calls.some((call) =>
        call.includes("INSERT INTO schema_migrations"),
      ),
    ).toBe(true);
  });
});
