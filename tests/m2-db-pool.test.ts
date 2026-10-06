import {
  getDatabasePool,
  resetDatabasePoolForTests,
  withDatabaseConnection,
  withTransaction,
  type DatabaseConnection,
  type DatabasePool,
} from "@/server/db/pool";
import { afterEach, describe, expect, it, vi } from "vitest";

const config = {
  configured: true as const,
  url: "mysql://saino:secret@db.internal:3306/saino",
  host: "db.internal",
  port: 3306,
  database: "saino",
  user: "saino",
  password: "secret",
  poolLimit: 2,
  queueLimit: 4,
  acquireTimeoutMs: 20,
  maxInstancesForBudget: 2,
  connectionBudget: 6,
};

function connection(): DatabaseConnection {
  return {
    query: vi.fn(async () => [[], []] as [unknown, unknown]),
    beginTransaction: vi.fn(async () => undefined),
    commit: vi.fn(async () => undefined),
    rollback: vi.fn(async () => undefined),
    release: vi.fn(),
  };
}

afterEach(() => {
  resetDatabasePoolForTests();
});

describe("bounded MySQL pool", () => {
  it("reuses one process-level pool", () => {
    const created: DatabasePool[] = [];
    const factory = vi.fn(() => {
      const pool = {
        getConnection: vi.fn(async () => connection()),
      } as DatabasePool;
      created.push(pool);
      return pool;
    });

    expect(getDatabasePool(config, factory)).toBe(
      getDatabasePool(config, factory),
    );
    expect(factory).toHaveBeenCalledOnce();
    expect(created).toHaveLength(1);
  });

  it("releases acquired connections and fails fast on queue timeout", async () => {
    const acquired = connection();
    const pool = {
      getConnection: vi.fn(async () => acquired),
    } as DatabasePool;

    await expect(
      withDatabaseConnection(pool, 20, async () => "ok"),
    ).resolves.toBe("ok");
    expect(acquired.release).toHaveBeenCalledOnce();

    const exhausted = {
      getConnection: vi.fn(() => new Promise<DatabaseConnection>(() => {})),
    } as DatabasePool;
    await expect(
      withDatabaseConnection(exhausted, 5, async () => "never"),
    ).rejects.toThrow(/acquire timeout/i);
  });

  it("commits successful transactions and rolls back failures", async () => {
    const success = connection();
    await expect(withTransaction(success, async () => "done")).resolves.toBe(
      "done",
    );
    expect(success.commit).toHaveBeenCalledOnce();
    expect(success.rollback).not.toHaveBeenCalled();

    const failure = connection();
    await expect(
      withTransaction(failure, async () => {
        throw new Error("query failed password=secret");
      }),
    ).rejects.toThrow(/query failed/i);
    expect(failure.rollback).toHaveBeenCalledOnce();
    expect(failure.commit).not.toHaveBeenCalled();
  });
});
