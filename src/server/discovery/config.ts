import type { MetadataRoute } from "next";

import {
  SITE_ENV,
  type SiteEnvironment,
} from "@/lib/site-config";

export type PublicCrawlStatus = "blocked" | "production-approved";

export const PUBLIC_CRAWL_STATUS: PublicCrawlStatus =
  process.env.PUBLIC_CRAWL_STATUS === "production-approved"
    ? "production-approved"
    : "blocked";

export function isPublicCrawlEnabled(
  environment: SiteEnvironment = SITE_ENV,
  status: PublicCrawlStatus | undefined = PUBLIC_CRAWL_STATUS,
) {
  return (
    environment === "production" && status === "production-approved"
  );
}

export function buildRobotsPolicy(
  siteUrl: string,
  crawlEnabled: boolean,
): MetadataRoute.Robots {
  if (!crawlEnabled) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api"],
    },
    sitemap: new URL("/sitemap.xml", siteUrl).toString(),
  };
}
