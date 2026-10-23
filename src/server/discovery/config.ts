import type { MetadataRoute } from "next";

export function buildRobotsPolicy(siteUrl: string): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api"],
    },
    sitemap: new URL("/sitemap.xml", siteUrl).toString(),
  };
}
