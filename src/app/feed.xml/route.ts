import { SITE_URL } from "@/lib/site-config";
import { buildRssXml } from "@/server/discovery/files";
import { createDiscoveryHandler } from "@/server/discovery/runtime";

export const runtime = "nodejs";
export const dynamic = "force-static";

export const GET = createDiscoveryHandler({
  contentType: "application/rss+xml; charset=utf-8",
  build: ({ contents }) => buildRssXml({ siteUrl: SITE_URL, contents }),
});
