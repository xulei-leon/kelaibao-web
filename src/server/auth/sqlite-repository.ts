import { insertSqliteSecurityAudit } from "@/server/audit/sqlite";
import type {
  AdminRepository,
  AdminSessionRecord,
} from "@/server/auth/repository";
import type {
  AdminAuthRecord,
  LockedAdminTransaction,
  SecurityAuditEvent,
  SessionWrite,
} from "@/server/auth/service";
import { hashToken } from "@/server/auth/session";
import {
  getRuntimeSqlite,
  sqliteDate,
  sqliteIso,
  withSqliteWriteTransaction,
  type LocalSqliteDatabase,
} from "@/server/db/sqlite/runtime";

type Row = Record<string, null | number | string | Uint8Array>;

function adminFromRow(row: Row): AdminAuthRecord {
  return {
    id: Number(row.id),
    username: String(row.username),
    passwordHash: String(row.password_hash),
    failedLoginCount: Number(row.failed_login_count),
    failedLoginWindowStartedAt: sqliteDate(
      row.failed_login_window_started_at,
    ),
    lockedUntil: sqliteDate(row.locked_until),
    disabledAt: sqliteDate(row.disabled_at),
  };
}

export class SqliteAuthRepository implements AdminRepository {
  private readonly path: string;
  private readonly database: LocalSqliteDatabase;

  constructor(runtime = getRuntimeSqlite()) {
    this.path = runtime.path;
    this.database = runtime.database;
  }

  async withLockedAdmin<T>(
    username: string,
    callback: (transaction: LockedAdminTransaction) => Promise<T>,
  ): Promise<T | null> {
    return withSqliteWriteTransaction(this.path, this.database, async () => {
      const row = this.database
        .prepare(
          `SELECT id, username, password_hash, failed_login_count,
                  failed_login_window_started_at, locked_until, disabled_at
             FROM admins
            WHERE username = ? COLLATE NOCASE
            LIMIT 1`,
        )
        .get(username);
      if (!row) return null;
      const admin = adminFromRow(row);
      const transaction: LockedAdminTransaction = {
        admin,
        recordFailure: async (state, event) => {
          this.database
            .prepare(
              `UPDATE admins
                  SET failed_login_count = ?,
                      failed_login_window_started_at = ?,
                      locked_until = ?, updated_at = ?
                WHERE id = ?`,
            )
            .run(
              state.failedLoginCount,
              sqliteIso(state.failedLoginWindowStartedAt),
              sqliteIso(state.lockedUntil),
              new Date().toISOString(),
              admin.id,
            );
          insertSqliteSecurityAudit(this.database, event);
        },
        recordSuccess: async (
          session: SessionWrite,
          replacementPasswordHash,
          event,
        ) => {
          const now = new Date(
            session.expiresAt.getTime() - 8 * 60 * 60 * 1_000,
          );
          this.database
            .prepare(
              `UPDATE admins
                  SET failed_login_count = 0,
                      failed_login_window_started_at = NULL,
                      locked_until = NULL,
                      password_hash = COALESCE(?, password_hash),
                      password_changed_at = CASE WHEN ? IS NULL
                        THEN password_changed_at ELSE ? END,
                      updated_at = ?
                WHERE id = ?`,
            )
            .run(
              replacementPasswordHash,
              replacementPasswordHash,
              now.toISOString(),
              now.toISOString(),
              admin.id,
            );
          this.database
            .prepare(
              `INSERT INTO admin_sessions
                (admin_id, session_token_hash, csrf_token_hash, expires_at,
                 created_at, last_seen_at)
               VALUES (?, ?, ?, ?, ?, ?)`,
            )
            .run(
              session.adminId,
              session.sessionTokenHash,
              session.csrfTokenHash,
              session.expiresAt.toISOString(),
              now.toISOString(),
              now.toISOString(),
            );
          insertSqliteSecurityAudit(this.database, event, now);
        },
      };
      return callback(transaction);
    });
  }

  async recordSecurityAudit(event: SecurityAuditEvent) {
    await withSqliteWriteTransaction(this.path, this.database, async () => {
      insertSqliteSecurityAudit(this.database, event);
    });
  }

  async findValidSession(
    sessionToken: string,
    now = new Date(),
  ): Promise<AdminSessionRecord | null> {
    return withSqliteWriteTransaction(this.path, this.database, async () => {
      const row = this.database
        .prepare(
          `SELECT s.id, s.admin_id, a.username, s.csrf_token_hash, s.expires_at
             FROM admin_sessions s
             JOIN admins a ON a.id = s.admin_id
            WHERE s.session_token_hash = ?
              AND s.revoked_at IS NULL
              AND s.expires_at > ?
              AND a.disabled_at IS NULL
            LIMIT 1`,
        )
        .get(hashToken(sessionToken), now.toISOString());
      if (!row) return null;
      this.database
        .prepare("UPDATE admin_sessions SET last_seen_at = ? WHERE id = ?")
        .run(now.toISOString(), Number(row.id));
      return {
        id: Number(row.id),
        adminId: Number(row.admin_id),
        username: String(row.username),
        csrfTokenHash: String(row.csrf_token_hash).toLowerCase(),
        expiresAt: sqliteDate(row.expires_at) ?? now,
      };
    });
  }

  async revokeSession(
    session: AdminSessionRecord,
    requestId: string,
    now = new Date(),
  ) {
    await withSqliteWriteTransaction(this.path, this.database, async () => {
      this.database
        .prepare(
          "UPDATE admin_sessions SET revoked_at = ? WHERE id = ? AND revoked_at IS NULL",
        )
        .run(now.toISOString(), session.id);
      insertSqliteSecurityAudit(
        this.database,
        {
          action: "logout",
          actorAdminId: session.adminId,
          requestId,
          metadata: { outcome: "success" },
        },
        now,
      );
    });
  }
}
