import { processNextPurgeJob } from "@/server/content/purge-jobs";
import { LocalSqlitePurgeProvider } from "@/server/content/sqlite-purge-job-repository";
import { redactServerError } from "@/server/config";
import { resolveServerConfig } from "@/server/config";
import { createCachePurgeJobRepository } from "@/server/db/repository-factory";
import {
  DirectHttpsEsaPurgeProvider,
  EsaPurgeError,
  resolveEsaPurgeConfig,
} from "@/server/integrations/esa/provider";

export function createConfiguredEsaPurgeProvider() {
  if (resolveServerConfig().databaseAdapter === "sqlite") {
    return new LocalSqlitePurgeProvider();
  }
  try {
    return new DirectHttpsEsaPurgeProvider(
      resolveEsaPurgeConfig(),
    );
  } catch {
    throw new EsaPurgeError("esa_config_unavailable", true);
  }
}

export async function attemptPostCommitPurge(
  purgeJobId: number,
  requestId: string,
) {
  try {
    return await processNextPurgeJob({
      repository: createCachePurgeJobRepository(),
      providerFactory: createConfiguredEsaPurgeProvider,
      jobId: purgeJobId,
      requestId,
    });
  } catch (error) {
    console.error(
      `Post-commit ESA purge deferred [${requestId}]: ${redactServerError(error)}`,
    );
    return { status: "deferred" as const };
  }
}
