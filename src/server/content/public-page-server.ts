import type { ParsedUrlQuery } from "node:querystring";

import {
  resolveServerConfig,
  type ServerConfig,
} from "@/server/config";
import type { ContentType } from "@/server/content/domain";
import type {
  PublicContentResult,
  PublicContentSnapshot,
} from "@/server/content/public-contract";
import { createContentRepository } from "@/server/db/repository-factory";
import {
  PRIVATE_NO_STORE,
  PUBLIC_CACHE_CONTROL,
  serializePublicContent,
} from "@/server/content/public-page";
import { isPublicCrawlEnabled } from "@/server/discovery/config";

interface PublicDetailRepository {
  getPublicBySlug(
    contentType: ContentType,
    slug: string,
  ): Promise<PublicContentResult>;
}

interface PublicListRepository {
  listPublishedByType(
    contentType: ContentType,
  ): Promise<PublicContentSnapshot[]>;
}

interface PublicPageContext {
  params?: ParsedUrlQuery;
  res: {
    statusCode: number;
    setHeader(name: string, value: string): void;
  };
}

function slugFromParams(value: ParsedUrlQuery[string]) {
  if (typeof value !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) {
    return null;
  }
  return value;
}

export function createPublicDetailServerSideProps(
  contentType: ContentType,
  repositoryFactory: () => PublicDetailRepository = () =>
    createContentRepository(),
  crawlEnabled = isPublicCrawlEnabled(),
) {
  return async (context: PublicPageContext) => {
    const slug = slugFromParams(context.params?.slug);
    if (!slug) {
      context.res.setHeader("Cache-Control", PRIVATE_NO_STORE);
      return { notFound: true } as const;
    }

    try {
      const result = await repositoryFactory().getPublicBySlug(
        contentType,
        slug,
      );
      if (result.status === "not_found") {
        context.res.setHeader("Cache-Control", PRIVATE_NO_STORE);
        return { notFound: true } as const;
      }
      if (result.status === "gone") {
        context.res.statusCode = 410;
        context.res.setHeader("Cache-Control", PRIVATE_NO_STORE);
        return {
          props: { state: "gone", contentType, slug },
        } as const;
      }
      context.res.setHeader("Cache-Control", PUBLIC_CACHE_CONTROL);
      return {
        props: {
          state: "published",
          contentType,
          crawlEnabled,
          item: serializePublicContent(result.item),
        },
      } as const;
    } catch {
      context.res.setHeader("Cache-Control", PRIVATE_NO_STORE);
      console.warn(
        "public_content_detail_failed component=content_repository reason=repository_unavailable",
      );
      throw new Error("public_content_unavailable");
    }
  };
}

export function createPublicListServerSideProps(
  contentType: ContentType,
  repositoryFactory?: () => PublicListRepository,
  crawlEnabled = isPublicCrawlEnabled(),
  serverConfig: ServerConfig = resolveServerConfig(),
) {
  return async (context: Pick<PublicPageContext, "res">) => {
    if (
      !repositoryFactory &&
      serverConfig.runtimeMode === "preview" &&
      !serverConfig.database &&
      !serverConfig.sqlite
    ) {
      context.res.setHeader("Cache-Control", PUBLIC_CACHE_CONTROL);
      return {
        props: { contentType, crawlEnabled, items: [] },
      } as const;
    }

    try {
      const repository = repositoryFactory?.() ?? createContentRepository();
      const items = await repository.listPublishedByType(contentType);
      context.res.setHeader("Cache-Control", PUBLIC_CACHE_CONTROL);
      return {
        props: {
          contentType,
          crawlEnabled,
          items: items.map(serializePublicContent),
        },
      } as const;
    } catch {
      context.res.setHeader("Cache-Control", PRIVATE_NO_STORE);
      console.warn(
        "public_content_list_failed component=content_repository reason=repository_unavailable",
      );
      throw new Error("public_content_unavailable");
    }
  };
}
