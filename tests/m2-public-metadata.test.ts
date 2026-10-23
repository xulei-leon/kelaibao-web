import { describe, expect, it, vi } from "vitest";

import {
  buildPublicContentMetadata,
  buildPublicContentStructuredData,
  buildPublicListMetadata,
  buildPublicListStructuredData,
  safeSerializeJsonLd,
} from "@/server/discovery/metadata";
import type { PublicArticle } from "@/content/article-types";

const item: PublicArticle = {
  contentType: "news",
  slug: "market-update",
  title: "市场更新",
  summary: "这是公开摘要。",

    body: [{ type: "paragraph", text: "公开正文" }],
  firstPublishedAt: new Date("2026-07-20T02:00:00.000Z"),
  publishedAt: new Date("2026-07-30T02:00:00.000Z"),
  updatedAt: new Date("2026-07-30T01:59:00.000Z"),
  coverImage: null,
};

describe("M2-04 public metadata and JSON-LD", () => {
  it("derives canonical, Open Graph, and crawl policy from the public DTO", () => {
    const metadata = buildPublicContentMetadata(
      item,
      "https://www.example.cn",
    );

    expect(metadata.title).toBe("市场更新｜客来宝");
    expect(metadata.description).toBe("这是公开摘要。");
    expect(metadata.alternates?.canonical).toBe(
      "https://www.example.cn/news/market-update",
    );
    expect(metadata.openGraph).toMatchObject({
      type: "article",
      title: "市场更新｜客来宝",
      description: "这是公开摘要。",
      url: "https://www.example.cn/news/market-update",
      publishedTime: "2026-07-20T02:00:00.000Z",
      modifiedTime: "2026-07-30T01:59:00.000Z",
    });
    expect(metadata.robots).toEqual({
      index: true,
      follow: true,
    });
  });

  it.each([
    { contentType: "news" as const, expectedType: "NewsArticle" },
    { contentType: "case" as const, expectedType: "Article" },
  ])("builds consistent $expectedType structured data", ({
    contentType,
    expectedType,
  }) => {
    const current = { ...item, contentType };
    const nodes = buildPublicContentStructuredData(
      current,
      "https://www.example.cn",
    );
    const serialized = safeSerializeJsonLd(() => nodes);

    expect(serialized).not.toBeNull();
    const parsed = JSON.parse(serialized!) as Array<Record<string, unknown>>;
    expect(parsed.map((node) => node["@type"])).toEqual([
      "Organization",
      "WebSite",
      "BreadcrumbList",
      expectedType,
    ]);
    const article = parsed[3];
    const segment = contentType === "news" ? "news" : "cases";
    expect(article).toMatchObject({
      headline: "市场更新",
      description: "这是公开摘要。",
      datePublished: "2026-07-20T02:00:00.000Z",
      dateModified: "2026-07-30T01:59:00.000Z",
      mainEntityOfPage: `https://www.example.cn/${segment}/market-update`,
    });
    expect(serialized).not.toContain("sourceHtml");
    expect(serialized).not.toContain("actorAdminId");
    expect(serialized).not.toMatch(/排名|流量保证|AI 引用/);
  });

  it("escapes script-closing data and omits JSON-LD on serialization failure", () => {
    const escaped = safeSerializeJsonLd(() => ({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "</script><script>alert(1)</script>",
    }));
    expect(escaped).not.toContain("</script>");
    expect(escaped).toContain("\\u003c/script\\u003e");

    const warning = vi.fn();
    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;
    const failed = safeSerializeJsonLd(() => cyclic, warning);
    expect(failed).toBeNull();
    expect(warning).toHaveBeenCalledWith(
      "public_jsonld_failed component=structured_data reason=serialization_failed",
    );
    expect(warning.mock.calls.flat().join(" ")).not.toContain(
      JSON.stringify(Object.keys(cyclic)),
    );
  });

  it("provides canonical list metadata and global/list structured data", () => {
    const metadata = buildPublicListMetadata(
      "case",
      "https://www.example.cn",
    );
    expect(metadata).toMatchObject({
      title: "案例｜客来宝",
      alternates: { canonical: "https://www.example.cn/cases" },
      robots: { index: true, follow: true },
      openGraph: {
        type: "website",
        url: "https://www.example.cn/cases",
      },
    });
    const nodes = buildPublicListStructuredData(
      "case",
      "https://www.example.cn",
    );
    expect(nodes.map((node) => node["@type"])).toEqual([
      "Organization",
      "WebSite",
      "BreadcrumbList",
    ]);
    expect(JSON.stringify(nodes)).toContain(
      "https://www.example.cn/cases",
    );
  });

  it("keeps the news list metadata and breadcrumb label aligned", () => {
    const metadata = buildPublicListMetadata(
      "news",
      "https://www.example.cn",
    );
    expect(metadata.title).toBe("新闻动态｜客来宝");
    expect(metadata.description).toBe(
      "查看客来宝、K-Link 产品、媒体服务及数字化展业相关的新闻、方法说明与行业观察。",
    );

    const nodes = buildPublicListStructuredData(
      "news",
      "https://www.example.cn",
    );
    expect(JSON.stringify(nodes)).toContain("新闻动态");
  });
});
