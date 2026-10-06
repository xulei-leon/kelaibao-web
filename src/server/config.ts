import { existsSync, lstatSync, realpathSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve } from "node:path";

type RuntimeMode = "preview" | "production";

type Environment = Record<string, string | undefined>;

export interface DatabaseServerConfig {
  configured: true;
  url: string;
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  poolLimit: number;
  queueLimit: number;
  acquireTimeoutMs: number;
  maxInstancesForBudget: number;
  connectionBudget: number;
}

export interface SqliteServerConfig {
  configured: true;
  path: string;
}

export interface ServerConfig {
  runtimeMode: RuntimeMode;
  appVersion: string;
  databaseAdapter?: "mysql" | "sqlite";
  database?: DatabaseServerConfig;
  sqlite?: SqliteServerConfig;
}

const MYSQL_ONLY_VARIABLES = [
  "MYSQL_POOL_LIMIT",
  "MYSQL_QUEUE_LIMIT",
  "MYSQL_ACQUIRE_TIMEOUT_MS",
  "MYSQL_MAX_APP_INSTANCES",
  "MYSQL_CONNECTION_BUDGET",
] as const;

function configured(env: Environment, name: string) {
  return Boolean(env[name]?.trim());
}

function sqlitePath(env: Environment) {
  const raw = env.SQLITE_DATABASE_PATH?.trim();
  if (!raw) throw new Error("SQLITE_DATABASE_PATH is required for SQLite.");
  const projectRoot = resolve(process.cwd());
  const allowedRoot = resolve(projectRoot, ".local-data");
  const target = resolve(projectRoot, raw);
  const fromAllowedRoot = relative(allowedRoot, target);
  if (
    target === allowedRoot ||
    fromAllowedRoot.startsWith("..") ||
    isAbsolute(fromAllowedRoot) ||
    !target.toLowerCase().endsWith(".sqlite")
  ) {
    throw new Error(
      "SQLITE_DATABASE_PATH must be a .sqlite file inside .local-data.",
    );
  }

  if (existsSync(target)) {
    if (lstatSync(target).isSymbolicLink()) {
      throw new Error("SQLITE_DATABASE_PATH cannot be a symlink or junction.");
    }
    const actualRoot = realpathSync(allowedRoot);
    const actualTarget = realpathSync(target);
    const fromActualRoot = relative(actualRoot, actualTarget);
    if (
      actualTarget === actualRoot ||
      fromActualRoot.startsWith("..") ||
      isAbsolute(fromActualRoot)
    ) {
      throw new Error("SQLITE_DATABASE_PATH escapes the .local-data directory.");
    }
  } else if (existsSync(dirname(target)) && existsSync(allowedRoot)) {
    const actualRoot = realpathSync(allowedRoot);
    const actualParent = realpathSync(dirname(target));
    const fromActualRoot = relative(actualRoot, actualParent);
    if (actualParent !== actualRoot && (fromActualRoot.startsWith("..") || isAbsolute(fromActualRoot))) {
      throw new Error("SQLITE_DATABASE_PATH escapes the .local-data directory.");
    }
  }
  return target;
}

function positiveInteger(
  env: Environment,
  name: string,
  fallback: number,
  minimum = 1,
) {
  const raw = env[name]?.trim();
  const value = raw ? Number(raw) : fallback;
  if (!Number.isSafeInteger(value) || value < minimum) {
    throw new Error(`${name} must be an integer >= ${minimum}.`);
  }
  return value;
}

function parseDatabaseUrl(value: string) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("DATABASE_URL must be a valid mysql:// URL.");
  }
  if (url.protocol !== "mysql:") {
    throw new Error("DATABASE_URL must use the mysql:// protocol.");
  }
  const database = url.pathname.replace(/^\/+/, "");
  if (!url.hostname || !url.username || !database) {
    throw new Error(
      "DATABASE_URL must include a host, user, and database name.",
    );
  }
  return {
    host: url.hostname,
    port: url.port ? Number(url.port) : 3306,
    database,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
  };
}

export function resolveServerConfig(
  env: Environment = process.env,
): ServerConfig {
  const runtimeMode: RuntimeMode =
    env.SINO_RUNTIME_MODE === "production" ? "production" : "preview";
  const appVersion = env.SINO_APP_VERSION?.trim() || "local";
  const databaseUrl = env.DATABASE_URL?.trim();
  const sqliteDatabasePath = env.SQLITE_DATABASE_PATH?.trim();
  const requestedAdapter = env.DATABASE_ADAPTER?.trim();
  const databaseRuntimeScope =
    env.DATABASE_RUNTIME_SCOPE?.trim() || "deployment";

  if (
    databaseRuntimeScope !== "deployment" &&
    databaseRuntimeScope !== "local-test"
  ) {
    throw new Error(
      "DATABASE_RUNTIME_SCOPE must be deployment or local-test.",
    );
  }

  const hasSqliteSpecificConfiguration = Boolean(
    sqliteDatabasePath || databaseRuntimeScope === "local-test",
  );

  if (
    requestedAdapter &&
    requestedAdapter !== "mysql" &&
    requestedAdapter !== "sqlite"
  ) {
    throw new Error("DATABASE_ADAPTER must be mysql or sqlite.");
  }

  if (requestedAdapter !== "sqlite" && hasSqliteSpecificConfiguration) {
    throw new Error(
      "SQLite-specific configuration requires DATABASE_ADAPTER=sqlite and conflicts with MySQL.",
    );
  }

  const adapter = requestedAdapter || (databaseUrl ? "mysql" : undefined);

  if (adapter === "sqlite") {
    if (databaseUrl || MYSQL_ONLY_VARIABLES.some((name) => configured(env, name))) {
      throw new Error("SQLite configuration conflicts with MySQL variables.");
    }
    if (databaseRuntimeScope !== "local-test") {
      throw new Error("SQLite requires DATABASE_RUNTIME_SCOPE=local-test.");
    }
    if (runtimeMode === "production") {
      throw new Error("SQLite is not allowed in production runtime.");
    }
    return {
      runtimeMode,
      appVersion,
      databaseAdapter: "sqlite",
      sqlite: { configured: true, path: sqlitePath(env) },
    };
  }

  if (!databaseUrl) {
    if (runtimeMode === "production") {
      throw new Error("DATABASE_URL is required at production runtime.");
    }
    return { runtimeMode, appVersion };
  }

  const parsed = parseDatabaseUrl(databaseUrl);
  const poolLimit = positiveInteger(env, "MYSQL_POOL_LIMIT", 2);
  const queueLimit = positiveInteger(env, "MYSQL_QUEUE_LIMIT", 4);
  const acquireTimeoutMs = positiveInteger(
    env,
    "MYSQL_ACQUIRE_TIMEOUT_MS",
    5_000,
    100,
  );
  const maxInstancesForBudget = positiveInteger(
    env,
    "MYSQL_MAX_APP_INSTANCES",
    1,
  );
  const connectionBudget = positiveInteger(
    env,
    "MYSQL_CONNECTION_BUDGET",
    4,
  );

  if (poolLimit * maxInstancesForBudget > connectionBudget) {
    throw new Error(
      "MySQL connection budget exceeded: MYSQL_POOL_LIMIT * MYSQL_MAX_APP_INSTANCES must be <= MYSQL_CONNECTION_BUDGET.",
    );
  }

  return {
    runtimeMode,
    appVersion,
    databaseAdapter: "mysql",
    database: {
      configured: true,
      url: databaseUrl,
      ...parsed,
      poolLimit,
      queueLimit,
      acquireTimeoutMs,
      maxInstancesForBudget,
      connectionBudget,
    },
  };
}

export function redactServerError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return message
    .replace(/mysql:\/\/[^\s]+/gi, "mysql://[REDACTED]")
    .replace(
      /([?&](?:OSSAccessKeyId|Signature|security-token)=)[^&\s]+/gi,
      "$1[REDACTED]",
    )
    .replace(
      /\b(password|authorization|cookie|set-cookie)\s*[:=]\s*[^\s,;]+/gi,
      "$1=[REDACTED]",
    )
    .replace(
      /\b(ADMIN_PASSWORD|ADMIN_DUMMY_PASSWORD_HASH|ADMIN_CSRF_SECRET|OSS_STS_ACCESS_KEY_SECRET|OSS_STS_SECURITY_TOKEN|csrfToken|sessionToken|nonce|secret|token)\s*[:=]\s*[^\s,;&]+/gi,
      "$1=[REDACTED]",
    )
    .replace(
      /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
      "[REDACTED_EMAIL]",
    )
    .replace(/\b1[3-9]\d{9}\b/g, "[REDACTED_PHONE]");
}
