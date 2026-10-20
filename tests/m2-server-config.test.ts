import {
  redactServerError,
  resolveServerConfig,
} from "@/server/config";
import { mkdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const createdPaths: string[] = [];

afterEach(() => {
  for (const path of createdPaths.splice(0)) {
    rmSync(path, { recursive: true, force: true });
  }
});

const databaseEnv = {
  SINO_RUNTIME_MODE: "preview",
  DATABASE_URL: "mysql://saino:super-secret@db.internal:3306/saino",
  DATABASE_RUNTIME_SCOPE: "deployment",
  MYSQL_POOL_LIMIT: "2",
  MYSQL_QUEUE_LIMIT: "4",
  MYSQL_ACQUIRE_TIMEOUT_MS: "3000",
  MYSQL_MAX_APP_INSTANCES: "2",
  MYSQL_CONNECTION_BUDGET: "6",
};

describe("M2 server runtime configuration", () => {
  it("parses a server-only MySQL configuration with a bounded pool budget", () => {
    const config = resolveServerConfig(databaseEnv);

    expect(config.runtimeMode).toBe("preview");
    expect(config.database).toEqual(
      expect.objectContaining({
        configured: true,
        host: "db.internal",
        port: 3306,
        database: "saino",
        poolLimit: 2,
        queueLimit: 4,
        acquireTimeoutMs: 3000,
        maxInstancesForBudget: 2,
        connectionBudget: 6,
      }),
    );
    expect(config.database?.password).toBe("super-secret");
  });

  it("allows database-free static content in preview and production", () => {
    expect(resolveServerConfig({ SINO_RUNTIME_MODE: "preview" }).database).toBe(
      undefined,
    );
    expect(resolveServerConfig({ SINO_RUNTIME_MODE: "production" }).database).toBeUndefined();
  });

  it("rejects non-MySQL URLs and a pool budget that can exhaust RDS", () => {
    expect(() =>
      resolveServerConfig({
        ...databaseEnv,
        DATABASE_URL: "postgres://db.internal/saino",
      }),
    ).toThrow(/mysql/);

    expect(() =>
      resolveServerConfig({
        ...databaseEnv,
        MYSQL_POOL_LIMIT: "4",
        MYSQL_MAX_APP_INSTANCES: "3",
        MYSQL_CONNECTION_BUDGET: "10",
      }),
    ).toThrow(/connection budget/i);
  });

  it("rejects an unsupported database runtime scope", () => {
    expect(() =>
      resolveServerConfig({
        ...databaseEnv,
        DATABASE_RUNTIME_SCOPE: "serverless",
      }),
    ).toThrow(/DATABASE_RUNTIME_SCOPE.*deployment.*local-test/i);
  });

  it("selects SQLite only for an explicit local-test scope", () => {
    const config = resolveServerConfig({
      SINO_RUNTIME_MODE: "preview",
      DATABASE_ADAPTER: "sqlite",
      DATABASE_RUNTIME_SCOPE: "local-test",
      SQLITE_DATABASE_PATH: ".local-data/kelaibao.test.sqlite",
    });

    expect(config.databaseAdapter).toBe("sqlite");
    expect(config.sqlite).toEqual(
      expect.objectContaining({
        configured: true,
        path: expect.stringMatching(/\.local-data[\\/]kelaibao\.test\.sqlite$/),
      }),
    );
    expect(config.database).toBeUndefined();
  });

  it("fails closed for SQLite in production and for ambiguous adapter variables", () => {
    expect(() =>
      resolveServerConfig({
        SINO_RUNTIME_MODE: "production",
        DATABASE_ADAPTER: "sqlite",
        DATABASE_RUNTIME_SCOPE: "local-test",
        SQLITE_DATABASE_PATH: ".local-data/kelaibao.test.sqlite",
      }),
    ).toThrow(/SQLite.*production/i);

    expect(() =>
      resolveServerConfig({
        SINO_RUNTIME_MODE: "preview",
        DATABASE_ADAPTER: "sqlite",
        DATABASE_RUNTIME_SCOPE: "local-test",
        SQLITE_DATABASE_PATH: ".local-data/kelaibao.test.sqlite",
        DATABASE_URL: databaseEnv.DATABASE_URL,
      }),
    ).toThrow(/conflict/i);

    expect(() =>
      resolveServerConfig({
        ...databaseEnv,
        DATABASE_ADAPTER: "mysql",
        SQLITE_DATABASE_PATH: ".local-data/kelaibao.test.sqlite",
      }),
    ).toThrow(/conflict/i);

    expect(() =>
      resolveServerConfig({
        SINO_RUNTIME_MODE: "preview",
        SQLITE_DATABASE_PATH: ".local-data/kelaibao.test.sqlite",
      }),
    ).toThrow(/DATABASE_ADAPTER=sqlite/i);

    expect(() =>
      resolveServerConfig({
        SINO_RUNTIME_MODE: "preview",
        DATABASE_RUNTIME_SCOPE: "local-test",
      }),
    ).toThrow(/DATABASE_ADAPTER=sqlite/i);
  });

  it("rejects SQLite paths outside the project local-data directory", () => {
    expect(() =>
      resolveServerConfig({
        SINO_RUNTIME_MODE: "preview",
        DATABASE_ADAPTER: "sqlite",
        DATABASE_RUNTIME_SCOPE: "local-test",
        SQLITE_DATABASE_PATH: "../outside.sqlite",
      }),
    ).toThrow(/\.local-data/i);
  });

  it("rejects an existing SQLite target symlink that escapes local-data", ({ skip }) => {
    const localDirectory = join(
      process.cwd(),
      ".local-data",
      `config-symlink-${Date.now()}`,
    );
    const outsideTarget = join(process.cwd(), `outside-config-${Date.now()}.sqlite`);
    const linkedTarget = join(localDirectory, "database.sqlite");
    mkdirSync(localDirectory, { recursive: true });
    writeFileSync(outsideTarget, "outside");
    createdPaths.push(localDirectory, outsideTarget);
    try {
      symlinkSync(outsideTarget, linkedTarget, "file");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "EPERM") return skip();
      throw error;
    }

    expect(() =>
      resolveServerConfig({
        SINO_RUNTIME_MODE: "preview",
        DATABASE_ADAPTER: "sqlite",
        DATABASE_RUNTIME_SCOPE: "local-test",
        SQLITE_DATABASE_PATH: linkedTarget,
      }),
    ).toThrow(/symlink|junction/i);
  });

  it("redacts database URLs, credentials, cookies, email, and phone data", () => {
    const redacted = redactServerError(
      new Error(
        "mysql://saino:super-secret@db.internal:3306/saino Authorization=BearerToken Cookie=session=secret owner@example.cn 13800138000",
      ),
    );

    expect(redacted).not.toMatch(/super-secret|BearerToken|session=secret/);
    expect(redacted).not.toMatch(/owner@example\.cn|13800138000/);
  });
});
