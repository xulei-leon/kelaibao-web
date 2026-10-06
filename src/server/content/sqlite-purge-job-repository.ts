import { insertSqliteSecurityAudit } from "@/server/audit/sqlite";
import type {
  CachePurgeJob,
  CachePurgeJobRepository,
} from "@/server/content/purge-jobs";
import {
  getRuntimeSqlite,
  sqliteIso,
  withSqliteWriteTransaction,
  type LocalSqliteDatabase,
} from "@/server/db/sqlite/runtime";

const PROCESSING_LEASE_MS = 30_000;

function jobFromRow(row: Record<string, unknown>): CachePurgeJob {
  const urls = JSON.parse(String(row.urls_json)) as unknown;
  if (!Array.isArray(urls) || urls.some((url) => typeof url !== "string")) {
    throw new Error("cache_purge_job_urls_invalid");
  }
  return {
    id: Number(row.id),
    idempotencyKey: String(row.idempotency_key),
    contentItemId: Number(row.content_item_id),
    contentRevisionId: Number(row.content_revision_id),
    urls,
    attemptCount: Number(row.attempt_count),
    createdBy: Number(row.created_by),
  };
}

export class SqliteCachePurgeJobRepository implements CachePurgeJobRepository {
  private readonly path: string;
  private readonly database: LocalSqliteDatabase;

  constructor(runtime = getRuntimeSqlite()) {
    this.path = runtime.path;
    this.database = runtime.database;
  }

  private async claim(now: Date, jobId?: number) {
    return withSqliteWriteTransaction(this.path, this.database, async () => {
      const whereId = jobId === undefined ? "" : "id = ? AND ";
      const values = jobId === undefined ? [now.toISOString()] : [jobId, now.toISOString()];
      const row = this.database.prepare(
        `SELECT id, idempotency_key, content_item_id, content_revision_id,
                urls_json, status, attempt_count, created_by
           FROM cache_purge_jobs
          WHERE ${whereId} next_attempt_at <= ?
            AND ((status IN ('pending', 'retry') AND attempt_count < 3)
              OR status = 'processing')
          ORDER BY next_attempt_at ASC, id ASC LIMIT 1`,
      ).get(...values);
      if (!row) return null;
      const previousStatus = String(row.status);
      const previousAttemptCount = Number(row.attempt_count);
      const nextAttemptCount = previousStatus === "processing"
        ? previousAttemptCount : previousAttemptCount + 1;
      const updated = this.database.prepare(
        `UPDATE cache_purge_jobs SET status = 'processing', attempt_count = ?,
                next_attempt_at = ?, updated_at = ?
          WHERE id = ? AND status = ? AND attempt_count = ?`,
      ).run(
        nextAttemptCount,
        new Date(now.getTime() + PROCESSING_LEASE_MS).toISOString(),
        now.toISOString(),
        Number(row.id), previousStatus, previousAttemptCount,
      );
      if (updated.changes !== 1) throw new Error("cache_purge_job_claim_conflict");
      return jobFromRow({ ...row, attempt_count: nextAttemptCount });
    });
  }

  claimNext(now: Date) {
    return this.claim(now);
  }

  claimById(jobId: number, now: Date) {
    if (!Number.isSafeInteger(jobId) || jobId < 1) {
      throw new Error("cache_purge_job_id_invalid");
    }
    return this.claim(now, jobId);
  }

  async markSucceeded({ job, providerRequestId, providerTaskId, now, requestId }:
    Parameters<CachePurgeJobRepository["markSucceeded"]>[0]) {
    await withSqliteWriteTransaction(this.path, this.database, async () => {
      const result = this.database.prepare(
        `UPDATE cache_purge_jobs SET status = 'succeeded', next_attempt_at = NULL,
                last_error_code = NULL, completed_at = ?, updated_at = ?
          WHERE id = ? AND status = 'processing' AND attempt_count = ?`,
      ).run(now.toISOString(), now.toISOString(), job.id, job.attemptCount);
      if (result.changes !== 1) throw new Error("cache_purge_job_completion_conflict");
      insertSqliteSecurityAudit(this.database, {
        action: "cache_purge_succeeded", actorAdminId: job.createdBy, requestId,
        metadata: {
          itemId: job.contentItemId, revisionId: job.contentRevisionId,
          purgeJobId: job.id, attemptCount: job.attemptCount,
          providerRequestId, providerTaskId,
        },
      }, now);
    });
  }

  async markFailed({ job, status, errorCode, nextAttemptAt, now, requestId }:
    Parameters<CachePurgeJobRepository["markFailed"]>[0]) {
    await withSqliteWriteTransaction(this.path, this.database, async () => {
      const result = this.database.prepare(
        `UPDATE cache_purge_jobs SET status = ?, next_attempt_at = ?,
                last_error_code = ?, completed_at = ?, updated_at = ?
          WHERE id = ? AND status = 'processing' AND attempt_count = ?`,
      ).run(
        status, sqliteIso(nextAttemptAt), errorCode,
        status === "failed" ? now.toISOString() : null,
        now.toISOString(), job.id, job.attemptCount,
      );
      if (result.changes !== 1) throw new Error("cache_purge_job_completion_conflict");
      insertSqliteSecurityAudit(this.database, {
        action: "cache_purge_failed", actorAdminId: job.createdBy, requestId,
        metadata: {
          itemId: job.contentItemId, revisionId: job.contentRevisionId,
          purgeJobId: job.id, attemptCount: job.attemptCount,
          outcome: status, errorCode,
        },
      }, now);
    });
  }
}

export class LocalSqlitePurgeProvider {
  async purgeUrls({ idempotencyKey }: { urls: string[]; idempotencyKey: string }) {
    return {
      providerRequestId: `local-${idempotencyKey.slice(0, 16)}`,
      providerTaskId: `sqlite-${idempotencyKey.slice(16, 32)}`,
    };
  }
}

