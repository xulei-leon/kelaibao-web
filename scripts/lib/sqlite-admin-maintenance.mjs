import { DatabaseSync } from "node:sqlite";

import {
  assertSafeExistingSqlitePath,
  resolveSqliteLocalTestPath,
} from "./sqlite-local-test.mjs";

function audit(database, adminId, action, reason, now) {
  database.prepare(
    `INSERT INTO audit_logs
      (actor_admin_id, action, entity_type, entity_id, request_id,
       metadata_json, created_at)
     VALUES (?, ?, 'admin', ?, ?, ?, ?)`,
  ).run(
    adminId,
    action,
    adminId === null ? null : String(adminId),
    `ops-${Date.now()}`,
    JSON.stringify({ reasonCode: reason, source: "controlled_ops" }),
    now,
  );
}

export function runSqliteAdminMaintenance({
  operation,
  username,
  encodedPassword,
  reason,
}) {
  const resolved = resolveSqliteLocalTestPath();
  const target = assertSafeExistingSqlitePath(resolved);
  const database = new DatabaseSync(target);
  database.exec("PRAGMA foreign_keys = ON");
  const version = database.prepare("SELECT MAX(version) AS version FROM schema_versions").get();
  if (Number(version?.version) !== 3) {
    database.close();
    throw new Error("SQLite schema is not initialized; run pnpm db:sqlite:migrate.");
  }
  database.exec("BEGIN IMMEDIATE");
  try {
    const now = new Date().toISOString();
    if (operation === "bootstrap") {
      const rows = database.prepare("SELECT id, username FROM admins ORDER BY id").all();
      if (rows.length > 0) {
        if (rows.length === 1 && String(rows[0].username).toLowerCase() === username) {
          database.exec("COMMIT");
          console.log("Administrator already exists; bootstrap is idempotent.");
          return;
        }
        throw new Error("Administrator singleton already exists.");
      }
      const result = database.prepare(
        `INSERT INTO admins
          (username, password_hash, password_changed_at, singleton_key,
           created_at, updated_at)
         VALUES (?, ?, ?, 1, ?, ?)`,
      ).run(username, encodedPassword, now, now, now);
      const adminId = Number(result.lastInsertRowid);
      audit(database, adminId, "admin_bootstrap", reason, now);
      database.exec("COMMIT");
      console.log("Administrator bootstrap completed.");
      return;
    }

    const admin = database.prepare(
      "SELECT id FROM admins WHERE username = ? COLLATE NOCASE LIMIT 1",
    ).get(username);
    if (!admin) throw new Error("Administrator maintenance target not found.");
    const adminId = Number(admin.id);
    if (operation === "reset-password") {
      database.prepare(
        `UPDATE admins SET password_hash = ?, password_changed_at = ?,
                failed_login_count = 0, failed_login_window_started_at = NULL,
                locked_until = NULL, updated_at = ?
          WHERE id = ?`,
      ).run(encodedPassword, now, now, adminId);
      database.prepare(
        "UPDATE admin_sessions SET revoked_at = ? WHERE admin_id = ? AND revoked_at IS NULL",
      ).run(now, adminId);
      audit(database, adminId, "password_reset", reason, now);
      database.exec("COMMIT");
      console.log("Administrator password reset completed and sessions revoked.");
      return;
    }

    database.prepare(
      "UPDATE admins SET disabled_at = ?, updated_at = ? WHERE id = ?",
    ).run(now, now, adminId);
    database.prepare(
      "UPDATE admin_sessions SET revoked_at = ? WHERE admin_id = ? AND revoked_at IS NULL",
    ).run(now, adminId);
    audit(database, adminId, "admin_disabled", reason, now);
    database.exec("COMMIT");
    console.log("Administrator disabled and sessions revoked.");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  } finally {
    database.close();
  }
}
