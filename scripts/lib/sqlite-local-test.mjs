import { existsSync, lstatSync, realpathSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve } from "node:path";

function inside(root, target) {
  const value = relative(root, target);
  return value && !value.startsWith("..") && !isAbsolute(value);
}

export function resolveSqliteLocalTestPath(env = process.env, cwd = process.cwd()) {
  if (env.DATABASE_ADAPTER !== "sqlite") {
    throw new Error("DATABASE_ADAPTER=sqlite is required.");
  }
  if (env.DATABASE_RUNTIME_SCOPE !== "local-test") {
    throw new Error("DATABASE_RUNTIME_SCOPE=local-test is required.");
  }
  if (env.SINO_RUNTIME_MODE === "production") {
    throw new Error("SQLite is not allowed in production runtime.");
  }
  if (env.DATABASE_URL?.trim()) {
    throw new Error("SQLite configuration conflicts with DATABASE_URL.");
  }
  for (const name of [
    "MYSQL_POOL_LIMIT",
    "MYSQL_QUEUE_LIMIT",
    "MYSQL_ACQUIRE_TIMEOUT_MS",
    "MYSQL_MAX_APP_INSTANCES",
    "MYSQL_CONNECTION_BUDGET",
  ]) {
    if (env[name]?.trim()) {
      throw new Error("SQLite configuration conflicts with MySQL variables.");
    }
  }
  const raw = env.SQLITE_DATABASE_PATH?.trim();
  if (!raw) throw new Error("SQLITE_DATABASE_PATH is required.");
  const projectRoot = resolve(cwd);
  const allowedRoot = resolve(projectRoot, ".local-data");
  const target = resolve(projectRoot, raw);
  if (!inside(allowedRoot, target) || !target.toLowerCase().endsWith(".sqlite")) {
    throw new Error("SQLite path must be a .sqlite file inside .local-data.");
  }
  return { projectRoot, allowedRoot, target };
}

export function assertSafeExistingSqlitePath({ allowedRoot, target }) {
  const actualRoot = realpathSync(allowedRoot);
  const parent = dirname(target);
  const parentStat = lstatSync(parent);
  if (parentStat.isSymbolicLink()) {
    throw new Error("SQLite parent directory cannot be a symlink or junction.");
  }
  const actualParent = realpathSync(parent);
  let actualTarget = resolve(actualParent, target.slice(parent.length + 1));
  if (existsSync(target)) {
    if (lstatSync(target).isSymbolicLink()) {
      throw new Error("SQLite database file cannot be a symlink or junction.");
    }
    actualTarget = realpathSync(target);
  }
  if (!inside(actualRoot, actualTarget)) {
    throw new Error("SQLite path escapes the allowed local-data directory.");
  }
  return actualTarget;
}

export const SQLITE_SIDECAR_SUFFIXES = ["", "-wal", "-shm", "-journal"];
