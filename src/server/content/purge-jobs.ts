import { insertSecurityAudit } from "@/server/audit/mysql";
import { nextPurgeRetry } from "@/server/content/purge";
import type { DatabaseConnection } from "@/server/db/pool";
import { withRuntimeDatabase } from "@/server/db/runtime";
import { EsaPurgeError } from "@/server/integrations/esa/provider";

const PROCESSING_LEASE_MS = 30_000;

export interface CachePurgeJob {
  id: number;
  idempotencyKey: string;
  contentItemId: number;
  contentRevisionId: number;
  urls: string[];
  attemptCount: number;
  createdBy: number;
}

interface PurgeProvider {
  purgeUrls(input: {
    urls: string[];
    idempotencyKey: string;
  }): Promise<{
    providerRequestId: string;
    providerTaskId: string;
  }>;
}

export interface CachePurgeJobRepository {
  claimNext(now: Date): Promise<CachePurgeJob | null>;
  claimById(jobId: number, now: Date): Promise<CachePurgeJob | null>;
  markSucceeded(input: {
    job: CachePurgeJob;
    providerRequestId: string;
    providerTaskId: string;
    now: Date;
    requestId: string;
  }): Promise<void>;
  markFailed(input: {
    job: CachePurgeJob;
    status: "retry" | "failed";
    errorCode: string;
    nextAttemptAt: Date | null;
    now: Date;
    requestId: string;
  }): Promise<void>;
}

type Row = Record<string, unknown>;
type DatabaseRunner = <T>(
  callback: (connection: DatabaseConnection) => Promise<T>,
) => Promise<T>;

function rows(result: unknown) {
  return Array.isArray(result) ? (result as Row[]) : [];
}

function parseUrls(value: unknown) {
  let parsed: unknown = value;
  if (typeof value === "string") {
    try {
      parsed = JSON.parse(value);
    } catch {
      throw new Error("cache_purge_job_urls_invalid");
    }
  }
  if (
    !Array.isArray(parsed) ||
    parsed.length < 1 ||
    parsed.length > 6 ||
    parsed.some((url) => typeof url !== "string")
  ) {
    throw new Error("cache_purge_job_urls_invalid");
  }
  return parsed as string[];
}

function jobFromRow(row: Row): CachePurgeJob {
  return {
    id: Number(row.id),
    idempotencyKey: String(row.idempotency_key),
    contentItemId: Number(row.content_item_id),
    contentRevisionId: Number(row.content_revision_id),
    urls: parseUrls(row.urls_json),
    attemptCount: Number(row.attempt_count),
    createdBy: Number(row.created_by),
  };
}

async function inTransaction<T>(
  database: DatabaseRunner,
  callback: (connection: DatabaseConnection) => Promise<T>,
) {
  return database(async (connection) => {
    await connection.beginTransaction();
    try {
      const result = await callback(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  });
}

function affectedRows(result: unknown) {
  return Number((result as { affectedRows?: number }).affectedRows);
}

export class MySqlCachePurgeJobRepository
  implements CachePurgeJobRepository
{
  constructor(
    private readonly database: DatabaseRunner = withRuntimeDatabase,
  ) {}

  private async claim(now: Date, jobId?: number) {
    return inTransaction(this.database, async (connection) => {
      const [result] = await connection.query(
        `SELECT id, idempotency_key, content_item_id, content_revision_id,
                urls_json, status, attempt_count, created_by
           FROM cache_purge_jobs
          WHERE ${jobId === undefined ? "" : "id = ? AND "}
                next_attempt_at <= ?
            AND (
              (status IN ('pending', 'retry') AND attempt_count < 3)
              OR status = 'processing'
            )
          ORDER BY next_attempt_at ASC, id ASC
          LIMIT 1
          FOR UPDATE SKIP LOCKED`,
        jobId === undefined ? [now] : [jobId, now],
      );
      const row = rows(result)[0];
      if (!row) return null;

      const claimedStatus = String(row.status);
      const previousAttemptCount = Number(row.attempt_count);
      const nextAttemptCount =
        claimedStatus === "processing"
          ? previousAttemptCount
          : previousAttemptCount + 1;
      const leaseExpiresAt = new Date(
        now.getTime() + PROCESSING_LEASE_MS,
      );
      const [updateResult] = await connection.query(
        `UPDATE cache_purge_jobs
            SET status = 'processing',
                attempt_count = ?,
                next_attempt_at = ?,
                updated_at = ?
          WHERE id = ?
            AND status = ?
            AND attempt_count = ?`,
        [
          nextAttemptCount,
          leaseExpiresAt,
          now,
          Number(row.id),
          claimedStatus,
          previousAttemptCount,
        ],
      );
      if (affectedRows(updateResult) !== 1) {
        throw new Error("cache_purge_job_claim_conflict");
      }
      return jobFromRow({
        ...row,
        attempt_count: nextAttemptCount,
      });
    });
  }

  async claimNext(now: Date) {
    return this.claim(now);
  }

  async claimById(jobId: number, now: Date) {
    if (!Number.isSafeInteger(jobId) || jobId < 1) {
      throw new Error("cache_purge_job_id_invalid");
    }
    return this.claim(now, jobId);
  }

  async markSucceeded({
    job,
    providerRequestId,
    providerTaskId,
    now,
    requestId,
  }: Parameters<CachePurgeJobRepository["markSucceeded"]>[0]) {
    await inTransaction(this.database, async (connection) => {
      const [result] = await connection.query(
        `UPDATE cache_purge_jobs
            SET status = 'succeeded',
                next_attempt_at = NULL,
                last_error_code = NULL,
                completed_at = ?,
                updated_at = ?
          WHERE id = ?
            AND status = 'processing'
            AND attempt_count = ?`,
        [now, now, job.id, job.attemptCount],
      );
      if (affectedRows(result) !== 1) {
        throw new Error("cache_purge_job_completion_conflict");
      }
      await insertSecurityAudit(connection, {
        action: "cache_purge_succeeded",
        actorAdminId: job.createdBy,
        requestId,
        metadata: {
          itemId: job.contentItemId,
          revisionId: job.contentRevisionId,
          purgeJobId: job.id,
          attemptCount: job.attemptCount,
          providerRequestId,
          providerTaskId,
        },
      });
    });
  }

  async markFailed({
    job,
    status,
    errorCode,
    nextAttemptAt,
    now,
    requestId,
  }: Parameters<CachePurgeJobRepository["markFailed"]>[0]) {
    await inTransaction(this.database, async (connection) => {
      const [result] = await connection.query(
        `UPDATE cache_purge_jobs
            SET status = ?,
                next_attempt_at = ?,
                last_error_code = ?,
                completed_at = CASE WHEN ? = 'failed' THEN ? ELSE NULL END,
                updated_at = ?
          WHERE id = ?
            AND status = 'processing'
            AND attempt_count = ?`,
        [
          status,
          nextAttemptAt,
          errorCode,
          status,
          now,
          now,
          job.id,
          job.attemptCount,
        ],
      );
      if (affectedRows(result) !== 1) {
        throw new Error("cache_purge_job_completion_conflict");
      }
      await insertSecurityAudit(connection, {
        action: "cache_purge_failed",
        actorAdminId: job.createdBy,
        requestId,
        metadata: {
          itemId: job.contentItemId,
          revisionId: job.contentRevisionId,
          purgeJobId: job.id,
          attemptCount: job.attemptCount,
          outcome: status,
          errorCode,
        },
      });
    });
  }
}

export async function processNextPurgeJob({
  repository,
  provider,
  providerFactory,
  jobId,
  now = new Date(),
  requestId,
}: {
  repository: CachePurgeJobRepository;
  provider?: PurgeProvider;
  providerFactory?: () => PurgeProvider;
  jobId?: number;
  now?: Date;
  requestId: string;
}) {
  if ((provider ? 1 : 0) + (providerFactory ? 1 : 0) !== 1) {
    throw new Error("Exactly one purge provider source is required.");
  }
  const job =
    jobId === undefined
      ? await repository.claimNext(now)
      : await repository.claimById(jobId, now);
  if (!job) {
    return {
      status: "empty" as const,
      ...(jobId === undefined ? {} : { requestedJobId: jobId }),
    };
  }

  try {
    const selectedProvider = provider ?? providerFactory?.();
    if (!selectedProvider) {
      throw new Error("Purge provider is unavailable.");
    }
    const result = await selectedProvider.purgeUrls({
      urls: job.urls,
      idempotencyKey: job.idempotencyKey,
    });
    await repository.markSucceeded({
      job,
      providerRequestId: result.providerRequestId,
      providerTaskId: result.providerTaskId,
      now,
      requestId,
    });
    return { status: "succeeded" as const, jobId: job.id };
  } catch (error) {
    const retryable =
      error instanceof EsaPurgeError ? error.retryable : true;
    const errorCode =
      error instanceof EsaPurgeError
        ? error.code
        : "unexpected_provider_error";
    const retry = retryable
      ? nextPurgeRetry(job.attemptCount, now)
      : { status: "failed" as const, nextAttemptAt: null };
    await repository.markFailed({
      job,
      status: retry.status,
      errorCode,
      nextAttemptAt: retry.nextAttemptAt,
      now,
      requestId,
    });
    return { status: retry.status, jobId: job.id };
  }
}
