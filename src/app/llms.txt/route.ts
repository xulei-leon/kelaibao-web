import { PUBLIC_ROUTES } from "@/lib/route-metadata";
import { SITE_URL } from "@/lib/site-config";
import { buildLlmsText } from "@/server/discovery/files";
import { createDiscoveryHandler } from "@/server/discovery/runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = createDiscoveryHandler({
  contentType: "text/plain; charset=utf-8",
  build: ({ contents }) =>
    buildLlmsText({
      siteUrl: SITE_URL,
      coreRoutes: PUBLIC_ROUTES,
      contents,
    }),
});
