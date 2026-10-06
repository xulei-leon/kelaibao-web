import type { AdminRepository } from "@/server/auth/repository";
import { MySqlAuthRepository } from "@/server/auth/mysql-repository";
import { SqliteAuthRepository } from "@/server/auth/sqlite-repository";
import { MySqlContentRepository } from "@/server/content/mysql-repository";
import { MySqlCachePurgeJobRepository, type CachePurgeJobRepository } from "@/server/content/purge-jobs";
import { SqliteCachePurgeJobRepository } from "@/server/content/sqlite-purge-job-repository";
import { SqliteContentRepository } from "@/server/content/sqlite-repository";
import type { ContentRepository } from "@/server/content/service";
import { resolveServerConfig } from "@/server/config";
import { MySqlMediaUploadRepository } from "@/server/media/mysql-repository";
import { SqliteMediaUploadRepository } from "@/server/media/sqlite-repository";
import type { MediaUploadRepository } from "@/server/media/service";

function selectedAdapter() {
  const config = resolveServerConfig();
  if (!config.databaseAdapter) {
    throw new Error("Database runtime is not configured.");
  }
  return config.databaseAdapter;
}

export function createAuthRepository(): AdminRepository {
  return selectedAdapter() === "sqlite"
    ? new SqliteAuthRepository()
    : new MySqlAuthRepository();
}

export function createContentRepository(): ContentRepository {
  return selectedAdapter() === "sqlite"
    ? new SqliteContentRepository()
    : new MySqlContentRepository();
}

export function createCachePurgeJobRepository(): CachePurgeJobRepository {
  return selectedAdapter() === "sqlite"
    ? new SqliteCachePurgeJobRepository()
    : new MySqlCachePurgeJobRepository();
}

export function createMediaUploadRepository(): MediaUploadRepository & Pick<MySqlMediaUploadRepository, "findById"> {
  return selectedAdapter() === "sqlite"
    ? new SqliteMediaUploadRepository()
    : new MySqlMediaUploadRepository();
}
