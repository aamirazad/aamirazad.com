import { uuidV7 } from "$lib/server/crypto";
import { statement, type Statement } from "$lib/server/db";

/** An audit trail entry, written in the same transaction as the change it records. */
export function auditEvent(actor: string, type: string, target: string, now: string): Statement {
  return statement(
    `INSERT INTO aamirazad_audit_events (id, actor_subject, event_type, target_id, created_at)
    VALUES ($1, $2, $3, $4, $5)`,
    uuidV7(),
    actor,
    type,
    target,
    now,
  );
}
