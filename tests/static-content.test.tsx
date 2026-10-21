import { renderToStaticMarkup } from "react-dom/server";
import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import type { ArticleSource } from "@/content/article-types";
import { createStaticCatalogue, STATIC_CONTENT } from "@/lib/static-content";
import { ArticleBody, PublicContentDetail, serializePublicContent } from "@/lib/content-pages";
import { buildPublicContentMetadata } from "@/server/discovery/metadata";
import { buildSitemapXml, buildRssXml } from "@/server/discovery/files";
import { GET as getHealth } from "@/app/api/health/route";

const article = (overrides: Partial<ArticleSource> = {}): ArticleSource => ({
  contentType: "news", slug: "public-story", title: "公开新闻", summary: "公开摘要",
  firstPublishedAt: "2026-10-01T09:00:00+08:00", publishedAt: "2026-10-01T09:00:00+08:00", updatedAt: "2026-10-02T09:00:00+08:00",
  body: [{ type: "heading", text: "正文标题" }, { type: "paragraph", text: "无需客户端脚本即可阅读。" }], coverImage: null, ...overrides,
});

afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); vi.doUnmock("@/content/articles"); });

describe("FR-25 static catalogue", () => {
  it("imports operations stories as public text with unique local images and discoverable paths", () => {
    const items = STATIC_CONTENT.list("news");
    expect(items).toHaveLength(5);
    const sitemap = buildSitemapXml({ contents: items, siteUrl: "https://site.example", coreRoutes: ["/news"] });
    for (const item of items) {
      expect(sitemap).toContain(`/news/${item.slug}`);
      const images = item.body.filter((block) => block.type === "image").map((block) => block.image);
      expect(new Set(images.map((image) => image.url)).size).toBe(images.length);
      for (const image of images) {
        expect(image.width).toBeGreaterThan(0);
        expect(image.height).toBeGreaterThan(0);
        expect(existsSync(`public${image.url}`)).toBe(true);
      }
      const html = renderToStaticMarkup(<ArticleBody blocks={item.body} />);
      expect(html).not.toMatch(/<script|待提供|<iframe/);
    }
  });
  it("preserves public paths/dates and deterministically sorts ties across both types", () => {
    const catalogue = createStaticCatalogue([article({ slug: "z" }), article({ slug: "a" }), article({ contentType: "case", slug: "a", authorizationReviewedAt: "2026-10-01T00:00:00Z" })]);
    expect(catalogue.list("news").map((item) => item.slug)).toEqual(["a", "z"]);
    expect(catalogue.list("case")).toHaveLength(1);
    const item = catalogue.find("news", "a")!;
    expect(item.firstPublishedAt.toISOString()).toBe("2026-10-01T01:00:00.000Z");
    expect(buildPublicContentMetadata(item, "https://site.example", false).alternates?.canonical).toBe("https://site.example/news/a");
    const input = { contents: catalogue.articles, siteUrl: "https://site.example", coreRoutes: ["/news", "/cases"] };
    expect(buildSitemapXml(input)).toContain("https://site.example/cases/a");
    expect(buildRssXml(input)).toContain(item.firstPublishedAt.toUTCString());
  });

  it.each([
    ["duplicate slug", [article(), article()]],
    ["invalid slug", [article({ slug: "../admin" })]],
    ["invalid date", [article({ publishedAt: "2026-02-30T00:00:00Z" })]],
    ["missing timezone", [article({ updatedAt: "2026-10-02" })]],
    ["missing title", [article({ title: " " })]],
    ["empty body", [article({ body: [] })]],
    ["unreviewed case", [article({ contentType: "case" })]],
    ["unsafe image", [article({ coverImage: { url: "javascript:alert(1)", width: 10, height: 10, alt: "图", mimeType: "image/png" } })]],
    ["image signature", [article({ coverImage: { url: "https://assets.example/a.png?token=secret", width: 10, height: 10, alt: "图", mimeType: "image/png" } })]],
  ] as const)("blocks a release with %s", (_, items) => {
    expect(() => createStaticCatalogue(items)).toThrow();
  });

  it("rejects overlapping public/withdrawn/redirect paths, duplicates and redirect chains", () => {
    expect(() => createStaticCatalogue([article()], ["/news/public-story"])).toThrow();
    expect(() => createStaticCatalogue([], ["/news/old", "/news/old"])).toThrow();
    expect(() => createStaticCatalogue([article()], ["/news/old"], [{ from: "/news/old", to: "/news/public-story" }])).toThrow();
    expect(() => createStaticCatalogue([article()], [], [{ from: "/news/old", to: "https://elsewhere.example" }])).toThrow();
    expect(() => createStaticCatalogue([article()], [], [{ from: "/news/old", to: "/news/other-old" }])).toThrow();
  });

  it("emits complete HTML and treats pasted HTML as text", () => {
    const item = createStaticCatalogue([article()]).articles[0];
    const html = renderToStaticMarkup(<PublicContentDetail state="published" contentType="news" crawlEnabled={false} item={serializePublicContent(item)} />);
    expect(html).toContain("无需客户端脚本即可阅读。");
    expect(html).toContain("2026-10-01T01:00:00.000Z");
    const unsafe = renderToStaticMarkup(<ArticleBody blocks={[{ type: "paragraph", text: '<script>alert("x")</script>' }]} />);
    expect(unsafe).not.toContain("<script>");
    expect(unsafe).toContain("&lt;script&gt;");
    expect(html).not.toMatch(/revision|actorAdminId|sanitizedHtml/);
  });

  it("prebuilds list/detail/SEO from the same static content even with an invalid database URL", async () => {
    vi.stubEnv("DATABASE_URL", "mysql://unavailable.invalid/missing");
    vi.stubEnv("DATABASE_ADAPTER", "broken-cms-adapter");
    vi.doMock("@/content/articles", () => ({ ARTICLES: [article()], WITHDRAWN_CONTENT: ["/news/withdrawn"], CONTENT_REDIRECTS: [{ from: "/news/old", to: "/news/public-story" }] }));
    const pages = await import("@/lib/static-content-pages");
    expect(pages.staticListProps("news").props.items).toHaveLength(1);
    expect(pages.staticDetailPaths("news")).toEqual({ paths: [{ params: { slug: "public-story" } }], fallback: false });
    expect(pages.staticDetailProps("news", "unknown")).toEqual({ notFound: true });
    expect(pages.staticDetailProps("news", "public-story")).toHaveProperty("props.item.title", "公开新闻");
    const { GET } = await import("@/app/sitemap.xml/route");
    expect(await GET().text()).toContain("/news/public-story");
    expect(await GET().text()).not.toMatch(/withdrawn|\/news\/old/);
    const { middleware } = await import("@/middleware");
    const gone = middleware(new NextRequest("https://site.example/news/withdrawn"));
    expect(gone.status).toBe(410);
    expect(await gone.text()).toContain("该新闻已下线");
    expect(gone.headers.get("cache-control")).toContain("no-store");
    const moved = middleware(new NextRequest("https://site.example/news/old"));
    expect(moved.status).toBe(308);
    expect(moved.headers.get("location")).toBe("https://site.example/news/public-story");
    expect(middleware(new NextRequest("https://site.example/news/unknown")).headers.get("x-middleware-next")).toBe("1");
  });

  it("uses absolute canonical image URLs for local static media", () => {
    const image = { url: "/brand/office-scenes.png", alt: "办公室", width: 1435, height: 1456, mimeType: "image/png" as const };
    const item = createStaticCatalogue([article({ coverImage: image })]).articles[0];
    expect(buildPublicContentMetadata(item, "https://site.example", false).openGraph?.images).toEqual([
      expect.objectContaining({ url: "https://site.example/brand/office-scenes.png" }),
    ]);
  });

  it("keeps production health independent of removed CMS credentials and closes old entry points", async () => {
    vi.stubEnv("SINO_RUNTIME_MODE", "production");
    vi.stubEnv("DATABASE_URL", "broken legacy value");
    const response = await getHealth();
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ contentSource: "static", runtimeMode: "production" });
    for (const path of ["src/app/admin/login/page.tsx", "src/app/api/admin/content/route.ts", "src/app/api/internal/cache-purge/route.ts"]) expect(existsSync(path)).toBe(false);
    for (const segment of ["news", "cases"]) {
      expect(readFileSync(`src/pages/${segment}/index.tsx`, "utf8")).toContain("getStaticProps");
      expect(readFileSync(`src/pages/${segment}/[slug].tsx`, "utf8")).not.toContain("getServerSideProps");
    }
  });
});
