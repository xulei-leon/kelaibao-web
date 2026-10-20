import { PUBLIC_ROUTES } from "@/lib/route-metadata";
import { SITE_URL } from "@/lib/site-config";
import { buildSitemapXml } from "@/server/discovery/files";
import { createDiscoveryHandler } from "@/server/discovery/runtime";

export const runtime = "nodejs";
export const dynamic = "force-static";

export const GET = createDiscoveryHandler({
  contentType: "application/xml; charset=utf-8",
  build: ({ contents }) =>
    buildSitemapXml({
      siteUrl: SITE_URL,
      coreRoutes: PUBLIC_ROUTES,
      contents,
    }),
});
