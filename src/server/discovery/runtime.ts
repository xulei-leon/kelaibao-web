import { STATIC_CONTENT } from "@/lib/static-content";
import type { PublicArticle } from "@/content/article-types";
import { PUBLIC_CACHE_CONTROL } from "@/lib/content-pages";

interface DiscoveryHandlerOptions {
  contentType: string;
  build(input: { news: PublicArticle[]; cases: PublicArticle[]; contents: PublicArticle[] }): string;
}

export function createDiscoveryHandler({ contentType, build }: DiscoveryHandlerOptions) {
  // With force-static routes this executes at build time. Invalid output fails
  // the build instead of silently publishing a database-dependent fallback.
  return function GET() {
    const body = build({ news: STATIC_CONTENT.list("news"), cases: STATIC_CONTENT.list("case"), contents: STATIC_CONTENT.articles });
    return new Response(body, { headers: { "Cache-Control": PUBLIC_CACHE_CONTROL, "Content-Type": contentType, "X-Content-Type-Options": "nosniff" } });
  };
}
