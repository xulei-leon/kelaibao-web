import { argon2id, hash } from "argon2";
import mysql from "mysql2/promise";

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

function integer(name, fallback, minimum, maximum) {
  const raw = process.env[name]?.trim();
  const value = raw ? Number(raw) : fallback;
  if (
    !Number.isSafeInteger(value) ||
    value < minimum ||
    value > maximum
  ) {
    throw new Error(`${name} is outside the allowed range.`);
  }
  return value;
}

function password() {
  const value = required("ADMIN_PASSWORD");
  if ([...value].length < 14 || Buffer.byteLength(value, "utf8") > 1024) {
    throw new Error("ADMIN_PASSWORD must contain at least 14 characters.");
  }
  return value;
}

function reasonCode() {
  const value = required("ADMIN_OPERATION_REASON_CODE");
  if (!/^[A-Z0-9._-]{1,64}$/i.test(value)) {
    throw new Error("ADMIN_OPERATION_REASON_CODE must be a stable code.");
  }
  return value;
}

async function passwordHash(value) {
  return hash(value, {
    type: argon2id,
    memoryCost: integer(
      "ARGON2_MEMORY_COST_KIB",
      19_456,
      19_456,
      131_072,
    ),
    timeCost: integer("ARGON2_TIME_COST", 2, 2, 10),
    parallelism: integer("ARGON2_PARALLELISM", 1, 1, 1),
    hashLength: integer("ARGON2_HASH_LENGTH", 32, 32, 64),
  });
}

async function audit(connection, adminId, action, reason) {
  await connection.query(
    `INSERT INTO audit_logs
      (actor_admin_id, action, entity_type, entity_id, request_id, metadata_json)
     VALUES (?, ?, 'admin', ?, ?, ?)`,
    [
      adminId,
      action,
      adminId === null ? null : String(adminId),
      `ops-${Date.now()}`,
      JSON.stringify({ reasonCode: reason, source: "controlled_ops" }),
    ],
  );
}

async function bootstrap(connection) {
  const username = required("ADMIN_USERNAME").toLowerCase();
  const encoded = await passwordHash(password());
  const reason = reasonCode();
  await connection.beginTransaction();
  try {
    const [rows] = await connection.query(
      "SELECT id, username FROM admins FOR UPDATE",
    );
    if (rows.length > 0) {
      if (rows.length === 1 && rows[0].username === username) {
        await connection.commit();
        console.log("Administrator already exists; bootstrap is idempotent.");
        return;
      }
      throw new Error("Administrator singleton already exists.");
    }
    const [result] = await connection.query(
      `INSERT INTO admins
        (username, password_hash, password_changed_at, singleton_key)
       VALUES (?, ?, UTC_TIMESTAMP(6), 1)`,
      [username, encoded],
    );
    const adminId = Number(result.insertId);
    await audit(connection, adminId, "admin_bootstrap", reason);
    await connection.commit();
    console.log("Administrator bootstrap completed.");
  } catch (error) {
    await connection.rollback();
    throw error;
  }
}

async function resetPassword(connection) {
  const username = required("ADMIN_USERNAME").toLowerCase();
  const encoded = await passwordHash(password());
  const reason = reasonCode();
  await connection.beginTransaction();
  try {
    const [rows] = await connection.query(
      "SELECT id FROM admins WHERE username = ? FOR UPDATE",
      [username],
    );
    if (rows.length !== 1) throw new Error("Administrator reset target not found.");
    const adminId = Number(rows[0].id);
    await connection.query(
      `UPDATE admins
          SET password_hash = ?, password_changed_at = UTC_TIMESTAMP(6),
              failed_login_count = 0,
              failed_login_window_started_at = NULL, locked_until = NULL
        WHERE id = ?`,
      [encoded, adminId],
    );
    await connection.query(
      "UPDATE admin_sessions SET revoked_at = UTC_TIMESTAMP(6) WHERE admin_id = ? AND revoked_at IS NULL",
      [adminId],
    );
    await audit(connection, adminId, "password_reset", reason);
    await connection.commit();
    console.log("Administrator password reset completed and sessions revoked.");
  } catch (error) {
    await connection.rollback();
    throw error;
  }
}

async function disable(connection) {
  const username = required("ADMIN_USERNAME").toLowerCase();
  const reason = reasonCode();
  await connection.beginTransaction();
  try {
    const [rows] = await connection.query(
      "SELECT id FROM admins WHERE username = ? FOR UPDATE",
      [username],
    );
    if (rows.length !== 1) throw new Error("Administrator disable target not found.");
    const adminId = Number(rows[0].id);
    await connection.query(
      "UPDATE admins SET disabled_at = UTC_TIMESTAMP(6) WHERE id = ?",
      [adminId],
    );
    await connection.query(
      "UPDATE admin_sessions SET revoked_at = UTC_TIMESTAMP(6) WHERE admin_id = ? AND revoked_at IS NULL",
      [adminId],
    );
    await audit(connection, adminId, "admin_disabled", reason);
    await connection.commit();
    console.log("Administrator disabled and sessions revoked.");
  } catch (error) {
    await connection.rollback();
    throw error;
  }
}

async function main() {
  const operation = process.argv[2];
  if (!["bootstrap", "reset-password", "disable"].includes(operation)) {
    throw new Error("Operation must be bootstrap, reset-password, or disable.");
  }
  const requestedAdapter = process.env.DATABASE_ADAPTER?.trim();
  const databaseUrl = process.env.DATABASE_URL?.trim();
  const databaseRuntimeScope =
    process.env.DATABASE_RUNTIME_SCOPE?.trim() || "deployment";
  if (
    databaseRuntimeScope !== "deployment" &&
    databaseRuntimeScope !== "local-test"
  ) {
    throw new Error(
      "DATABASE_RUNTIME_SCOPE must be deployment or local-test.",
    );
  }
  const hasSqliteSpecificConfiguration = Boolean(
    process.env.SQLITE_DATABASE_PATH?.trim() ||
      databaseRuntimeScope === "local-test",
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
  if (!adapter) {
    throw new Error("DATABASE_URL is required unless DATABASE_ADAPTER=sqlite.");
  }
  if (adapter === "sqlite") {
    const { runSqliteAdminMaintenance } = await import(
      "./lib/sqlite-admin-maintenance.mjs"
    );
    const username = required("ADMIN_USERNAME").toLowerCase();
    const reason = reasonCode();
    const encodedPassword =
      operation === "disable" ? null : await passwordHash(password());
    runSqliteAdminMaintenance({
      operation,
      username,
      encodedPassword,
      reason,
    });
    return;
  }
  const selectedDatabaseUrl = required("DATABASE_URL");
  if (!selectedDatabaseUrl.startsWith("mysql://")) {
    throw new Error("DATABASE_URL must use mysql://.");
  }
  const pool = mysql.createPool({
    uri: selectedDatabaseUrl,
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
      "SELECT GET_LOCK('saino_admin_maintenance', 10) AS acquired",
    );
    acquired = Number(lockRows[0]?.acquired) === 1;
    if (!acquired) throw new Error("Unable to acquire administrator maintenance lock.");
    if (operation === "bootstrap") await bootstrap(connection);
    if (operation === "reset-password") await resetPassword(connection);
    if (operation === "disable") await disable(connection);
  } finally {
    if (acquired) {
      await connection.query(
        "SELECT RELEASE_LOCK('saino_admin_maintenance')",
      );
    }
    connection.release();
    await pool.end();
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(
    `Administrator maintenance stopped: ${message.replace(
      /mysql:\/\/[^\s]+/gi,
      "mysql://[REDACTED]",
    )}`,
  );
  process.exitCode = 1;
});
