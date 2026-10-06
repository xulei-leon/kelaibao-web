import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import {
  PUBLIC_CACHE_CONTROL,
  PublicContentDetail,
  type PublicDetailPageProps,
} from "@/server/content/public-page";
import {
  createPublicDetailServerSideProps,
  createPublicListServerSideProps,
} from "@/server/content/public-page-server";
import type {
  PublicContentResult,
  PublicContentSnapshot,
} from "@/server/content/public-contract";

const published: PublicContentSnapshot = {
  id: 104,
  contentItemId: 12,
  revisionNumber: 4,
  contentType: "news",
  slug: "market-update",
  title: "市场更新",
  summary: "这是公开摘要。",
  sanitizedHtml: "<h2>公开正文</h2><p>无需客户端脚本即可读取。</p>",
  sanitizerPolicyVersion: "m2-html-v1",
  firstPublishedAt: new Date("2026-07-20T02:00:00.000Z"),
  publishedAt: new Date("2026-07-30T02:00:00.000Z"),
  updatedAt: new Date("2026-07-30T01:59:00.000Z"),
  coverImage: null,
};

function context(slug = "market-update") {
  const headers = new Map<string, string>();
  return {
    params: { slug },
    req: { headers: {} },
    res: {
      statusCode: 200,
      setHeader(name: string, value: string) {
        headers.set(name.toLowerCase(), value);
      },
    },
    headers,
  };
}

function repository(result: PublicContentResult | Error) {
  return {
    async getPublicBySlug() {
      if (result instanceof Error) throw result;
      return result;
    },
  };
}

describe("M2-04 public detail SSR", () => {
  it("returns serialized published props, a 60-second cache contract, and core HTML", async () => {
    expect(PUBLIC_CACHE_CONTROL).toBe(
      "public, s-maxage=60, must-revalidate",
    );
    expect(PUBLIC_CACHE_CONTROL).not.toContain(
      "stale-while-revalidate",
    );
    const ctx = context();
    const getServerSideProps = createPublicDetailServerSideProps(
      "news",
      () => repository({ status: "published", item: published }),
    );

    const result = await getServerSideProps(ctx as never);

    expect(result).toEqual({
      props: {
        state: "published",
        contentType: "news",
        crawlEnabled: false,
        item: {
          ...published,
          firstPublishedAt: "2026-07-20T02:00:00.000Z",
          publishedAt: "2026-07-30T02:00:00.000Z",
          updatedAt: "2026-07-30T01:59:00.000Z",
        },
      },
    });
    expect(ctx.res.statusCode).toBe(200);
    expect(ctx.headers.get("cache-control")).toBe(PUBLIC_CACHE_CONTROL);

    const html = renderToStaticMarkup(
      <PublicContentDetail
        {...(
          result as { props: PublicDetailPageProps }
        ).props}
      />,
    );
    expect(html).toContain("<h1");
    expect(html).toContain("市场更新");
    expect(html).toContain("这是公开摘要");
    expect(html).toContain("无需客户端脚本即可读取");
    expect(html).toContain("首页");
    expect(html).toContain("新闻");
    expect(html).toContain("发布方");
    expect(html).toContain("客来宝");
    expect(html).toContain("2026");
    expect(html).not.toContain("sourceHtml");
    expect(html).not.toContain("__NEXT_DATA__");
  });

  it.each([
    { publicResult: { status: "not_found" as const }, expected: "notFound" },
    { publicResult: { status: "gone" as const }, expected: "gone" },
  ])("maps $expected without shared caching", async ({
    publicResult,
    expected,
  }) => {
    const ctx = context();
    const getServerSideProps = createPublicDetailServerSideProps(
      "case",
      () => repository(publicResult),
    );

    const result = await getServerSideProps(ctx as never);

    expect(ctx.headers.get("cache-control")).toBe(
      "private, no-store, max-age=0",
    );
    if (expected === "notFound") {
      expect(result).toEqual({ notFound: true });
      return;
    }
    expect(ctx.res.statusCode).toBe(410);
    expect(result).toEqual({
      props: {
        state: "gone",
        contentType: "case",
        slug: "market-update",
      },
    });
    const html = renderToStaticMarkup(
      <PublicContentDetail
        {...(
          result as { props: PublicDetailPageProps }
        ).props}
      />,
    );
    expect(html).toContain("该案例已下线");
    expect(html.match(/<h1/g)).toHaveLength(1);
  });

  it("turns repository failures into a stable 5xx path and redacted warning", async () => {
    const warning = vi.spyOn(console, "warn").mockImplementation(() => {});
    const ctx = context("private-draft-body");
    const getServerSideProps = createPublicDetailServerSideProps(
      "news",
      () =>
        repository(
          new Error(
            "SELECT source_html; DATABASE_URL=mysql://secret private-draft-body",
          ),
        ),
    );

    await expect(getServerSideProps(ctx as never)).rejects.toThrow(
      "public_content_unavailable",
    );
    expect(ctx.headers.get("cache-control")).toBe(
      "private, no-store, max-age=0",
    );
    expect(warning).toHaveBeenCalledOnce();
    const logged = warning.mock.calls.flat().join(" ");
    expect(logged).toContain("public_content_detail_failed");
    expect(logged).not.toContain("DATABASE_URL");
    expect(logged).not.toContain("private-draft-body");
  });

  it("serializes public lists with the same cache and failure boundary", async () => {
    const successContext = context();
    const getSuccessProps = createPublicListServerSideProps(
      "news",
      () => ({
        async listPublishedByType() {
          return [published];
        },
      }),
    );

    const result = await getSuccessProps(successContext as never);

    expect(successContext.headers.get("cache-control")).toBe(
      PUBLIC_CACHE_CONTROL,
    );
    expect(result).toMatchObject({
      props: {
        contentType: "news",
        crawlEnabled: false,
        items: [
          {
            slug: "market-update",
            firstPublishedAt: "2026-07-20T02:00:00.000Z",
          },
        ],
      },
    });

    const warning = vi.spyOn(console, "warn").mockImplementation(() => {});
    const failureContext = context();
    const getFailureProps = createPublicListServerSideProps(
      "news",
      () => ({
        async listPublishedByType() {
          throw new Error("source_html private-list-body");
        },
      }),
    );
    await expect(
      getFailureProps(failureContext as never),
    ).rejects.toThrow("public_content_unavailable");
    expect(failureContext.headers.get("cache-control")).toBe(
      "private, no-store, max-age=0",
    );
    const logged = warning.mock.calls.flat().join(" ");
    expect(logged).toContain("public_content_list_failed");
    expect(logged).not.toContain("private-list-body");
  });

  it("renders an empty public list when Preview intentionally has no database", async () => {
    const previewContext = context();
    const getServerSideProps = createPublicListServerSideProps(
      "news",
      undefined,
      false,
      { runtimeMode: "preview", appVersion: "test" },
    );

    await expect(
      getServerSideProps(previewContext as never),
    ).resolves.toEqual({
      props: {
        contentType: "news",
        crawlEnabled: false,
        items: [],
      },
    });
    expect(previewContext.headers.get("cache-control")).toBe(
      PUBLIC_CACHE_CONTROL,
    );
  });
});
