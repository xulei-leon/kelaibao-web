import type { PublicContentSnapshot } from "@/server/content/public-contract";
import { createContentRepository } from "@/server/db/repository-factory";
import {
  PRIVATE_NO_STORE,
  PUBLIC_CACHE_CONTROL,
} from "@/server/content/public-page";

interface DiscoveryRepository {
  listPublishedByType(
    contentType: "news" | "case",
  ): Promise<PublicContentSnapshot[]>;
}

interface DiscoveryHandlerOptions {
  contentType: string;
  repositoryFactory?: () => DiscoveryRepository;
  build(input: {
    news: PublicContentSnapshot[];
    cases: PublicContentSnapshot[];
    contents: PublicContentSnapshot[];
  }): string;
}

export function createDiscoveryHandler({
  contentType,
  build,
  repositoryFactory = () => createContentRepository(),
}: DiscoveryHandlerOptions) {
  return async () => {
    try {
      const repository = repositoryFactory();
      const [news, cases] = await Promise.all([
        repository.listPublishedByType("news"),
        repository.listPublishedByType("case"),
      ]);
      const body = build({ news, cases, contents: [...news, ...cases] });
      return new Response(body, {
        headers: {
          "Cache-Control": PUBLIC_CACHE_CONTROL,
          "Content-Type": contentType,
          "X-Content-Type-Options": "nosniff",
        },
      });
    } catch {
      console.warn(
        "public_discovery_failed component=discovery_output reason=generation_failed",
      );
      return new Response("Discovery output is unavailable.", {
        status: 503,
        headers: {
          "Cache-Control": PRIVATE_NO_STORE,
          "Content-Type": "text/plain; charset=utf-8",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }
  };
}
