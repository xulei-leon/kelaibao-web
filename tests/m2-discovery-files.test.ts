import { describe, expect, it, vi } from "vitest";

import type { PublicArticle } from "@/content/article-types";
import {
  buildLlmsText,
  buildRssXml,
  buildSitemapXml,
} from "@/server/discovery/files";
import {
  buildRobotsPolicy,
  isPublicCrawlEnabled,
} from "@/server/discovery/config";
import { createDiscoveryHandler } from "@/server/discovery/runtime";

function item(
  id: number,
  contentType: "news" | "case" = "news",
): PublicArticle {
  return {
    contentType,
    slug: `entry-${String(id).padStart(3, "0")}`,
    title: id === 1 ? "公开 & 更新 <一>" : `公开内容 ${id}`,
    summary: `公开摘要 ${id}`,

    body: [{ type: "paragraph", text: "公开正文" }],
    firstPublishedAt: new Date(`2026-07-20T02:${String(id % 60).padStart(2, "0")}:00.000Z`),
    publishedAt: new Date(
      Date.parse("2026-07-30T02:00:00.000Z") - id * 1000,
    ),
    updatedAt: new Date(
      Date.parse("2026-07-30T01:00:00.000Z") - id * 1000,
    ),
    coverImage: null,
  };
}

describe("M2-04 crawl gate", () => {
  it("only opens crawling for an explicitly approved production environment", () => {
    expect(isPublicCrawlEnabled("preview", "production-approved")).toBe(false);
    expect(isPublicCrawlEnabled("production", "blocked")).toBe(false);
    expect(isPublicCrawlEnabled("production", undefined)).toBe(false);
    expect(
      isPublicCrawlEnabled("production", "production-approved"),
    ).toBe(true);

    expect(
      buildRobotsPolicy("https://www.example.cn", false),
    ).toEqual({
      rules: { userAgent: "*", disallow: "/" },
    });
    expect(
      buildRobotsPolicy("https://www.example.cn", true),
    ).toEqual({
      rules: {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api"],
      },
      sitemap: "https://www.example.cn/sitemap.xml",
    });
  });
});

describe("M2-04 discovery files", () => {
  const siteUrl = "https://www.example.cn";
  const coreRoutes = ["/", "/media", "/privacy"];
  const published = [item(2, "case"), item(1, "news")];

  it("builds absolute, deterministic sitemap/RSS/llms outputs", () => {
    const sitemap = buildSitemapXml({
      siteUrl,
      coreRoutes,
      contents: published,
    });
    const rss = buildRssXml({ siteUrl, contents: published });
    const llms = buildLlmsText({
      siteUrl,
      coreRoutes,
      contents: published,
    });

    expect(sitemap).toContain("<loc>https://www.example.cn/media</loc>");
    expect(sitemap).toContain(
      "<loc>https://www.example.cn/news/entry-001</loc>",
    );
    expect(sitemap).toContain(
      "<loc>https://www.example.cn/cases/entry-002</loc>",
    );
    expect(sitemap.indexOf("entry-001")).toBeLessThan(
      sitemap.indexOf("entry-002"),
    );
    expect(rss).toContain("<rss version=\"2.0\"");
    expect(rss).toContain("<title>客来宝公开内容</title>");
    expect(rss).toContain("公开 &amp; 更新 &lt;一&gt;");
    expect(rss).toContain(
      "<link>https://www.example.cn/news/entry-001</link>",
    );
    expect(llms).toContain("实验性");
    expect(llms).toContain("# 客来宝");
    expect(llms).toContain("https://www.example.cn/cases/entry-002");
    expect(`${rss}\n${llms}`).not.toContain("赛诺全网");

    for (const retired of [
      "/services",
      "/for/direct-sales",
      "/for/insurance",
      "/for/securities",
      "/method",
    ]) {
      expect(`${sitemap}\n${rss}\n${llms}`).not.toContain(
        `${siteUrl}${retired}`,
      );
    }

    for (const output of [sitemap, rss, llms]) {
      expect(output).not.toMatch(/\/admin|\/api|sourceHtml|private/i);
      expect(output).not.toMatch(/https:\/\/[^\s<)]+[?#]/);
    }
  });

  it("includes every static article and core route", () => {
    const contents = Array.from({ length: 105 }, (_, index) =>
      item(index + 1, index % 2 ? "case" : "news"),
    );
    const sitemap = buildSitemapXml({ siteUrl, coreRoutes, contents });
    const cmsMatches = sitemap.match(/\/(?:news|cases)\/entry-/g) ?? [];

    expect(cmsMatches).toHaveLength(105);
    for (const route of coreRoutes) {
      expect(sitemap).toContain(
        `<loc>${new URL(route, siteUrl).toString()}</loc>`,
      );
    }
  });

  it("builds discovery from the static catalogue without a repository", async () => {
    const handler = createDiscoveryHandler({ contentType: "text/plain", build: ({ contents }) => JSON.stringify(contents) });
    const response = handler();
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("s-maxage=86400");
    const items = await response.json();
    expect(items).toHaveLength(5);
    expect(items.map((item: { slug: string }) => item.slug)).toContain("article-a");
    const broken = createDiscoveryHandler({ contentType: "text/plain", build() { throw new Error("invalid content"); } });
    expect(broken).toThrow("invalid content");
  });
});
