import {
  processNextPurgeJob,
  type CachePurgeJob,
  type CachePurgeJobRepository,
} from "@/server/content/purge-jobs";
import { EsaPurgeError } from "@/server/integrations/esa/provider";
import { describe, expect, it, vi } from "vitest";

const now = new Date("2026-07-30T02:00:00.000Z");
const job: CachePurgeJob = {
  id: 9,
  idempotencyKey: "a".repeat(64),
  contentItemId: 12,
  contentRevisionId: 105,
  urls: ["https://www.example.cn/news"],
  attemptCount: 1,
  createdBy: 1,
};

function repository(current: CachePurgeJob | null) {
  const succeeded: number[] = [];
  const failed: Array<{
    id: number;
    status: "retry" | "failed";
    errorCode: string;
    nextAttemptAt: Date | null;
  }> = [];
  const value: CachePurgeJobRepository & {
    succeeded: number[];
    failed: typeof failed;
  } = {
    succeeded,
    failed,
    async claimNext() {
      return current;
    },
    async claimById(jobId) {
      return current?.id === jobId ? current : null;
    },
    async markSucceeded(input) {
      succeeded.push(input.job.id);
    },
    async markFailed(input) {
      failed.push({
        id: input.job.id,
        status: input.status,
        errorCode: input.errorCode,
        nextAttemptAt: input.nextAttemptAt,
      });
    },
  };
  return value;
}

describe("M2-03 cache purge jobs", () => {
  it("marks a claimed job succeeded only after the HTTPS provider succeeds", async () => {
    const jobs = repository(job);
    const provider = {
      purgeUrls: vi.fn(async () => ({
        providerRequestId: "request-1",
        providerTaskId: "task-1",
      })),
    };

    await expect(
      processNextPurgeJob({
        repository: jobs,
        provider,
        now,
        requestId: "purge-run-1",
      }),
    ).resolves.toEqual({ status: "succeeded", jobId: 9 });
    expect(jobs.succeeded).toEqual([9]);
    expect(jobs.failed).toEqual([]);
  });

  it("records a bounded retry for a retryable provider failure", async () => {
    const jobs = repository(job);
    const provider = {
      purgeUrls: vi.fn(async () => {
        throw new EsaPurgeError("http_429", true);
      }),
    };

    await expect(
      processNextPurgeJob({
        repository: jobs,
        provider,
        now,
        requestId: "purge-run-2",
      }),
    ).resolves.toEqual({ status: "retry", jobId: 9 });
    expect(jobs.failed).toEqual([
      {
        id: 9,
        status: "retry",
        errorCode: "http_429",
        nextAttemptAt: new Date("2026-07-30T02:00:05.000Z"),
      },
    ]);
  });

  it("terminates non-retryable or third-attempt failures and handles an empty queue", async () => {
    const terminal = repository({ ...job, attemptCount: 3 });
    const provider = {
      purgeUrls: vi.fn(async () => {
        throw new EsaPurgeError("http_403", false);
      }),
    };
    await expect(
      processNextPurgeJob({
        repository: terminal,
        provider,
        now,
        requestId: "purge-run-3",
      }),
    ).resolves.toEqual({ status: "failed", jobId: 9 });
    expect(terminal.failed[0]).toMatchObject({
      status: "failed",
      errorCode: "http_403",
      nextAttemptAt: null,
    });

    await expect(
      processNextPurgeJob({
        repository: repository(null),
        provider,
        now,
        requestId: "purge-run-4",
      }),
    ).resolves.toEqual({ status: "empty" });
  });

  it("targets the mutation job id and records provider setup failures through retry audit state", async () => {
    const jobs = repository(job);
    const claimNext = vi.spyOn(jobs, "claimNext");
    const claimById = vi.spyOn(jobs, "claimById");

    await expect(
      processNextPurgeJob({
        repository: jobs,
        providerFactory() {
          throw new EsaPurgeError("esa_config_unavailable", true);
        },
        jobId: 9,
        now,
        requestId: "purge-exact-9",
      }),
    ).resolves.toEqual({ status: "retry", jobId: 9 });
    expect(claimNext).not.toHaveBeenCalled();
    expect(claimById).toHaveBeenCalledWith(9, now);
    expect(jobs.failed[0]).toMatchObject({
      id: 9,
      status: "retry",
      errorCode: "esa_config_unavailable",
      nextAttemptAt: new Date("2026-07-30T02:00:05.000Z"),
    });
  });
});
