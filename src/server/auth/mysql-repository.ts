import {
  insertSecurityAudit,
} from "@/server/audit/mysql";
import {
  type AdminAuthRecord,
  type AuthRepository,
  type LockedAdminTransaction,
  type SecurityAuditEvent,
  type SessionWrite,
} from "@/server/auth/service";
import { hashToken } from "@/server/auth/session";
import type {
  AdminRepository,
  AdminSessionRecord,
} from "@/server/auth/repository";
import { withRuntimeDatabase } from "@/server/db/runtime";

type Row = Record<string, unknown>;

function rows(result: unknown) {
  return Array.isArray(result) ? (result as Row[]) : [];
}

function date(value: unknown) {
  return value instanceof Date ? value : value ? new Date(String(value)) : null;
}

function adminFromRow(row: Row): AdminAuthRecord {
  return {
    id: Number(row.id),
    username: String(row.username),
    passwordHash: String(row.password_hash),
    failedLoginCount: Number(row.failed_login_count),
    failedLoginWindowStartedAt: date(
      row.failed_login_window_started_at,
    ),
    lockedUntil: date(row.locked_until),
    disabledAt: date(row.disabled_at),
  };
}

export class MySqlAuthRepository implements AdminRepository {
  async withLockedAdmin<T>(
    username: string,
    callback: (transaction: LockedAdminTransaction) => Promise<T>,
  ): Promise<T | null> {
    return withRuntimeDatabase(async (connection) => {
      await connection.beginTransaction();
      try {
        const [result] = await connection.query(
          `SELECT id, username, password_hash, failed_login_count,
                  failed_login_window_started_at, locked_until, disabled_at
             FROM admins
            WHERE username = ?
            FOR UPDATE`,
          [username],
        );
        const row = rows(result)[0];
        if (!row) {
          await connection.commit();
          return null;
        }

        const admin = adminFromRow(row);
        const transaction: LockedAdminTransaction = {
          admin,
          async recordFailure(state, event) {
            await connection.query(
              `UPDATE admins
                  SET failed_login_count = ?,
                      failed_login_window_started_at = ?,
                      locked_until = ?
                WHERE id = ?`,
              [
                state.failedLoginCount,
                state.failedLoginWindowStartedAt,
                state.lockedUntil,
                admin.id,
              ],
            );
            await insertSecurityAudit(connection, event);
          },
          async recordSuccess(
            session: SessionWrite,
            replacementPasswordHash,
            event,
          ) {
            await connection.query(
              `UPDATE admins
                  SET failed_login_count = 0,
                      failed_login_window_started_at = NULL,
                      locked_until = NULL,
                      password_hash = COALESCE(?, password_hash),
                      password_changed_at = CASE
                        WHEN ? IS NULL THEN password_changed_at
                        ELSE UTC_TIMESTAMP(6)
                      END
                WHERE id = ?`,
              [
                replacementPasswordHash,
                replacementPasswordHash,
                admin.id,
              ],
            );
            await connection.query(
              `INSERT INTO admin_sessions
                (admin_id, session_token_hash, csrf_token_hash, expires_at)
               VALUES (?, ?, ?, ?)`,
              [
                session.adminId,
                Buffer.from(session.sessionTokenHash, "hex"),
                Buffer.from(session.csrfTokenHash, "hex"),
                session.expiresAt,
              ],
            );
            await insertSecurityAudit(connection, event);
          },
        };

        const value = await callback(transaction);
        await connection.commit();
        return value;
      } catch (error) {
        await connection.rollback();
        throw error;
      }
    });
  }

  async recordSecurityAudit(event: SecurityAuditEvent) {
    await withRuntimeDatabase((connection) =>
      insertSecurityAudit(connection, event),
    );
  }

  async findValidSession(
    sessionToken: string,
    now = new Date(),
  ): Promise<AdminSessionRecord | null> {
    return withRuntimeDatabase(async (connection) => {
      const [result] = await connection.query(
        `SELECT s.id, s.admin_id, a.username,
                HEX(s.csrf_token_hash) AS csrf_token_hash,
                s.expires_at
           FROM admin_sessions s
           JOIN admins a ON a.id = s.admin_id
          WHERE s.session_token_hash = ?
            AND s.revoked_at IS NULL
            AND s.expires_at > ?
            AND a.disabled_at IS NULL
          LIMIT 1`,
        [Buffer.from(hashToken(sessionToken), "hex"), now],
      );
      const row = rows(result)[0];
      if (!row || !row.csrf_token_hash) return null;
      await connection.query(
        "UPDATE admin_sessions SET last_seen_at = ? WHERE id = ?",
        [now, Number(row.id)],
      );
      return {
        id: Number(row.id),
        adminId: Number(row.admin_id),
        username: String(row.username),
        csrfTokenHash: String(row.csrf_token_hash).toLowerCase(),
        expiresAt: date(row.expires_at) ?? now,
      };
    });
  }

  async revokeSession(
    session: AdminSessionRecord,
    requestId: string,
    now = new Date(),
  ) {
    await withRuntimeDatabase(async (connection) => {
      await connection.beginTransaction();
      try {
        await connection.query(
          `UPDATE admin_sessions
              SET revoked_at = ?
            WHERE id = ? AND revoked_at IS NULL`,
          [now, session.id],
        );
        await insertSecurityAudit(connection, {
          action: "logout",
          actorAdminId: session.adminId,
          requestId,
          metadata: { outcome: "success" },
        });
        await connection.commit();
      } catch (error) {
        await connection.rollback();
        throw error;
      }
    });
  }
}
