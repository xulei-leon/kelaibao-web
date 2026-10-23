import robots from "@/app/robots";
import { PUBLIC_ROUTES } from "@/lib/route-metadata";
import {
  SITE_URL,
  resolveSiteUrl,
} from "@/lib/site-config";
import { buildLlmsText, buildSitemapXml } from "@/server/discovery/files";
import { describe, expect, it } from "vitest";

describe("indexing and public configuration", () => {
  it("allows public crawling and advertises the sitemap by default", () => {
    expect(robots()).toEqual({
      rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api"] },
      sitemap: new URL("/sitemap.xml", SITE_URL).toString(),
    });
  });

  it("includes only approved routes in sitemap", () => {
    const sitemap = buildSitemapXml({
      siteUrl: SITE_URL,
      coreRoutes: PUBLIC_ROUTES,
      contents: [],
    });
    expect(sitemap.match(/<url>/g)).toHaveLength(PUBLIC_ROUTES.length);
    for (const route of PUBLIC_ROUTES) {
      expect(sitemap).toContain(
        `<loc>${new URL(route, SITE_URL).toString()}</loc>`,
      );
    }
    expect(sitemap).not.toContain("/cases/");
  });

  it("publishes all six primary navigation routes through discovery", () => {
    const sitemap = buildSitemapXml({
      siteUrl: SITE_URL,
      coreRoutes: PUBLIC_ROUTES,
      contents: [],
    });
    const llms = buildLlmsText({
      siteUrl: SITE_URL,
      coreRoutes: PUBLIC_ROUTES,
      contents: [],
    });

    for (const route of [
      "/",
      "/features",
      "/team",
      "/media",
      "/news",
      "/about",
    ] as const) {
      expect(PUBLIC_ROUTES).toContain(route);
      const canonical = new URL(route, SITE_URL).toString();
      expect(sitemap).toContain(`<loc>${canonical}</loc>`);
      expect(llms).toContain(canonical);
    }
  });

  it("publishes /media without emitting retired consultant canonicals", () => {
    const input = {
      siteUrl: SITE_URL,
      coreRoutes: PUBLIC_ROUTES,
      contents: [],
    };
    const sitemap = buildSitemapXml(input);
    const llms = buildLlmsText(input);

    expect(PUBLIC_ROUTES).toContain("/media");
    expect(sitemap).toContain(
      `<loc>${new URL("/media", SITE_URL).toString()}</loc>`,
    );
    expect(llms).toContain(new URL("/media", SITE_URL).toString());

    for (const retired of [
      "/services",
      "/for/direct-sales",
      "/for/insurance",
      "/for/securities",
      "/method",
    ]) {
      expect(`${sitemap}\n${llms}`).not.toContain(
        new URL(retired, SITE_URL).toString(),
      );
    }
  });

  it("rejects invalid and preview-only production origins", () => {
    expect(() => resolveSiteUrl("ftp://example.com", "preview")).toThrow(/HTTP\(S\)/);
    expect(() =>
      resolveSiteUrl("https://preview.example.invalid", "production"),
    ).toThrow(/真实 HTTPS/);
    expect(resolveSiteUrl("https://www.example.cn", "production")).toBe(
      "https://www.example.cn",
    );
  });

});
