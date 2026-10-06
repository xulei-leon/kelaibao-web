import type { DatabaseConnection } from "@/server/db/pool";
import type { SecurityAuditEvent } from "@/server/auth/service";

export async function insertSecurityAudit(
  connection: DatabaseConnection,
  event: SecurityAuditEvent,
) {
  await connection.query(
    `INSERT INTO audit_logs
      (actor_admin_id, action, entity_type, entity_id, request_id, metadata_json)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      event.actorAdminId,
      event.action,
      "security",
      event.actorAdminId === null ? null : String(event.actorAdminId),
      event.requestId,
      JSON.stringify(event.metadata),
    ],
  );
}
