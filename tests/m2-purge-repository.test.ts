import { MySqlCachePurgeJobRepository } from "@/server/content/purge-jobs";
import type { DatabaseConnection } from "@/server/db/pool";
import { describe, expect, it, vi } from "vitest";

const now = new Date("2026-07-30T02:00:00.000Z");

describe("M2-03 MySQL purge outbox repository", () => {
  it("claims one ready job with a row lock and increments its bounded attempt", async () => {
    const queries: string[] = [];
    const connection = {
      query: vi.fn(async (sql: string) => {
        queries.push(sql.replace(/\s+/g, " ").trim());
        if (/^SELECT/.test(sql.trim())) {
          return [
            [
              {
                id: 9,
                idempotency_key: "a".repeat(64),
                content_item_id: 12,
                content_revision_id: 105,
                urls_json: JSON.stringify([
                  "https://www.example.cn/news",
                ]),
                status: "pending",
                attempt_count: 0,
                created_by: 1,
              },
            ],
            [],
          ] as [unknown, unknown];
        }
        return [{ affectedRows: 1 }, []] as [unknown, unknown];
      }),
      beginTransaction: vi.fn(),
      commit: vi.fn(),
      rollback: vi.fn(),
      release: vi.fn(),
    } satisfies DatabaseConnection;
    const repository = new MySqlCachePurgeJobRepository(async (callback) =>
      callback(connection),
    );

    await expect(repository.claimNext(now)).resolves.toMatchObject({
      id: 9,
      attemptCount: 1,
    });
    expect(queries[0]).toMatch(/FOR UPDATE SKIP LOCKED/);
    expect(queries[0]).toMatch(/attempt_count < 3/);
    expect(connection.beginTransaction).toHaveBeenCalledOnce();
    expect(connection.commit).toHaveBeenCalledOnce();
    expect(connection.rollback).not.toHaveBeenCalled();
  });

  it("reclaims an expired processing lease without consuming another provider attempt", async () => {
    const inputs: unknown[][] = [];
    const connection = {
      query: vi.fn(async (sql: string, values: unknown[] = []) => {
        inputs.push(values);
        if (/^SELECT/.test(sql.trim())) {
          return [
            [
              {
                id: 9,
                idempotency_key: "a".repeat(64),
                content_item_id: 12,
                content_revision_id: 105,
                urls_json: ["https://www.example.cn/news"],
                status: "processing",
                attempt_count: 3,
                created_by: 1,
              },
            ],
            [],
          ] as [unknown, unknown];
        }
        return [{ affectedRows: 1 }, []] as [unknown, unknown];
      }),
      beginTransaction: vi.fn(),
      commit: vi.fn(),
      rollback: vi.fn(),
      release: vi.fn(),
    } satisfies DatabaseConnection;
    const repository = new MySqlCachePurgeJobRepository(async (callback) =>
      callback(connection),
    );

    await expect(repository.claimNext(now)).resolves.toMatchObject({
      id: 9,
      attemptCount: 3,
    });
    const updateValues = inputs[1];
    expect(updateValues[0]).toBe(3);
    expect(updateValues[1]).toEqual(
      new Date("2026-07-30T02:00:30.000Z"),
    );
  });

  it("updates terminal state and failure audit in one transaction without raw provider data", async () => {
    const values: unknown[][] = [];
    const connection = {
      query: vi.fn(async (_sql: string, input: unknown[] = []) => {
        values.push(input);
        return [{ affectedRows: 1 }, []] as [unknown, unknown];
      }),
      beginTransaction: vi.fn(),
      commit: vi.fn(),
      rollback: vi.fn(),
      release: vi.fn(),
    } satisfies DatabaseConnection;
    const repository = new MySqlCachePurgeJobRepository(async (callback) =>
      callback(connection),
    );

    await repository.markFailed({
      job: {
        id: 9,
        idempotencyKey: "a".repeat(64),
        contentItemId: 12,
        contentRevisionId: 105,
        urls: ["https://www.example.cn/news"],
        attemptCount: 3,
        createdBy: 1,
      },
      status: "failed",
      errorCode: "http_503",
      nextAttemptAt: null,
      now,
      requestId: "purge-terminal",
    });
    expect(connection.commit).toHaveBeenCalledOnce();
    expect(JSON.stringify(values)).toContain("http_503");
    expect(JSON.stringify(values)).not.toMatch(/authorization|response body/i);
  });
});
