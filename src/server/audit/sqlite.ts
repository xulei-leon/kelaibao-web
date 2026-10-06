import type { SecurityAuditEvent } from "@/server/auth/service";
import type { LocalSqliteDatabase } from "@/server/db/sqlite/runtime";

export function insertSqliteSecurityAudit(
  database: LocalSqliteDatabase,
  event: SecurityAuditEvent,
  now = new Date(),
) {
  database
    .prepare(
      `INSERT INTO audit_logs
        (actor_admin_id, action, entity_type, entity_id, request_id,
         metadata_json, created_at)
       VALUES (?, ?, 'security', ?, ?, ?, ?)`,
    )
    .run(
      event.actorAdminId,
      event.action,
      event.actorAdminId === null ? null : String(event.actorAdminId),
      event.requestId,
      JSON.stringify(event.metadata),
      now.toISOString(),
    );
}

