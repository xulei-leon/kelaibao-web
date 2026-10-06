import {
  createPool,
  type Pool,
  type PoolConnection,
  type PoolOptions,
} from "mysql2/promise";

import {
  redactServerError,
  type DatabaseServerConfig,
} from "@/server/config";

export interface DatabaseConnection {
  query(sql: string, values?: unknown[]): Promise<[unknown, unknown]>;
  beginTransaction(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
  release(): void;
}

export interface DatabasePool {
  getConnection(): Promise<DatabaseConnection>;
}

type PoolFactory = (options: PoolOptions) => DatabasePool;

const globalForDatabase = globalThis as typeof globalThis & {
  sainoDatabasePool?: DatabasePool;
};

export function getDatabasePool(
  config: DatabaseServerConfig,
  factory: PoolFactory = createPool as unknown as PoolFactory,
) {
  if (!globalForDatabase.sainoDatabasePool) {
    globalForDatabase.sainoDatabasePool = factory({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      charset: "utf8mb4",
      timezone: "Z",
      waitForConnections: true,
      connectionLimit: config.poolLimit,
      queueLimit: config.queueLimit,
      connectTimeout: config.acquireTimeoutMs,
      enableKeepAlive: true,
      multipleStatements: false,
    });
  }
  return globalForDatabase.sainoDatabasePool;
}

export function resetDatabasePoolForTests() {
  delete globalForDatabase.sainoDatabasePool;
}

function acquireConnection(pool: DatabasePool, timeoutMs: number) {
  return new Promise<DatabaseConnection>((resolve, reject) => {
    let settled = false;
    const timeout = setTimeout(() => {
      settled = true;
      reject(new Error("MySQL pool acquire timeout."));
    }, timeoutMs);

    pool.getConnection().then(
      (connection) => {
        if (settled) {
          connection.release();
          return;
        }
        settled = true;
        clearTimeout(timeout);
        resolve(connection);
      },
      () => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        reject(new Error("MySQL connection unavailable."));
      },
    );
  });
}

export async function withDatabaseConnection<T>(
  pool: DatabasePool,
  timeoutMs: number,
  callback: (connection: DatabaseConnection) => Promise<T>,
) {
  const connection = await acquireConnection(pool, timeoutMs);
  try {
    await connection.query(
      "SET SESSION sql_mode = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION'",
    );
    await connection.query("SET time_zone = '+00:00'");
    return await callback(connection);
  } catch (error) {
    throw new Error(redactServerError(error));
  } finally {
    connection.release();
  }
}

export async function withTransaction<T>(
  connection: DatabaseConnection,
  callback: () => Promise<T>,
) {
  await connection.beginTransaction();
  try {
    const result = await callback();
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw new Error(redactServerError(error));
  }
}

export type MySqlPool = Pool;
export type MySqlPoolConnection = PoolConnection;
