import { NextResponse } from "next/server";

import { requestIdFromRequest } from "@/server/auth/request";
import {
  processNextPurgeJob,
} from "@/server/content/purge-jobs";
import { createConfiguredEsaPurgeProvider } from "@/server/content/purge-runtime";
import { assertPurgeWorkerRequest } from "@/server/content/purge-worker-auth";
import { redactServerError } from "@/server/config";
import { createCachePurgeJobRepository } from "@/server/db/repository-factory";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_JOBS_PER_INVOCATION = 10;

export async function POST(request: Request) {
  const requestId = requestIdFromRequest(request);
  try {
    assertPurgeWorkerRequest(request);
    const repository = createCachePurgeJobRepository();
    const results = { succeeded: 0, retry: 0, failed: 0 };
    for (let index = 0; index < MAX_JOBS_PER_INVOCATION; index += 1) {
      const result = await processNextPurgeJob({
        repository,
        providerFactory: createConfiguredEsaPurgeProvider,
        requestId: `${requestId}-${index + 1}`,
      });
      if (result.status === "empty") break;
      results[result.status] += 1;
    }
    return NextResponse.json({
      ok: true,
      ...results,
      requestId,
      evidenceStatus: "LOCAL_CONTRACT_ONLY_M2_LEGACY_01_DEFERRED",
    });
  } catch (error) {
    console.error(
      `Cache purge worker rejected [${requestId}]: ${redactServerError(error)}`,
    );
    return NextResponse.json(
      {
        ok: false,
        message: "Cache purge worker request rejected.",
        requestId,
      },
      { status: 401 },
    );
  }
}
