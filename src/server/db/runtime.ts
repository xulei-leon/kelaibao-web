import { resolveServerConfig } from "@/server/config";
import {
  getDatabasePool,
  withDatabaseConnection,
  type DatabaseConnection,
} from "@/server/db/pool";

export async function withRuntimeDatabase<T>(
  callback: (connection: DatabaseConnection) => Promise<T>,
) {
  const config = resolveServerConfig();
  if (!config.database) {
    throw new Error("Database runtime is not configured.");
  }
  const pool = getDatabasePool(config.database);
  return withDatabaseConnection(
    pool,
    config.database.acquireTimeoutMs,
    callback,
  );
}
