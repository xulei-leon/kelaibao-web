import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  createPageMetadata,
  PUBLIC_ROUTES,
  ROUTE_METADATA,
} from "@/lib/route-metadata";
import { describe, expect, it } from "vitest";
import nextConfig from "../next.config";

describe("public route and metadata contract", () => {
  it("keeps the approved public route inventory complete", () => {
    expect(PUBLIC_ROUTES).toEqual([
      "/",
      "/features",
      "/team",
      "/media",
      "/media/packages",
      "/news",
      "/about",
      "/privacy",
      "/terms",
      "/disclaimer",
      "/results",
    ]);

    const pageFiles = [
      "src/app/page.tsx",
      "src/app/features/page.tsx",
      "src/app/team/page.tsx",
      "src/app/media/page.tsx",
      "src/app/media/packages/page.tsx",
      "src/pages/news/index.tsx",
      "src/app/about/page.tsx",
      "src/app/privacy/page.tsx",
      "src/app/terms/page.tsx",
      "src/app/disclaimer/page.tsx",
      "src/app/results/page.tsx",
    ];

    pageFiles.forEach((file) => {
      expect(existsSync(join(process.cwd(), file)), file).toBe(true);
    });

    for (const retiredPage of [
      "src/app/contact/page.tsx",
      "src/app/services/page.tsx",
      "src/app/for/[profession]/page.tsx",
      "src/app/method/page.tsx",
    ]) {
      expect(existsSync(join(process.cwd(), retiredPage)), retiredPage).toBe(
        false,
      );
    }
  });

  it("gives every primary navigation route canonical and Open Graph metadata", () => {
    const primaryRoutes = [
      "/",
      "/features",
      "/team",
      "/media",
      "/news",
      "/about",
    ] as const;

    for (const route of primaryRoutes) {
      const item = Reflect.get(ROUTE_METADATA, route) as
        | { title: string; description: string; canonical: string }
        | undefined;
      expect(item, route).toBeDefined();
      expect(item?.title, route).toMatch(/[\u3400-\u9fff]/);
      expect(item?.description, route).toMatch(/[\u3400-\u9fff]/);
      expect(item?.canonical, route).toBe(route);

      if (item) {
        const openGraphUrl = createPageMetadata(route as never).openGraph?.url;
        expect(new URL(String(openGraphUrl)).pathname, route).toBe(route);
      }
    }
  });

  it("provides unique Chinese metadata and canonical paths", () => {
    const metadata = Object.values(ROUTE_METADATA);
    expect(new Set(metadata.map(({ title }) => title))).toHaveLength(metadata.length);
    expect(new Set(metadata.map(({ description }) => description))).toHaveLength(
      metadata.length,
    );

    for (const route of PUBLIC_ROUTES) {
      const item = ROUTE_METADATA[route];
      expect(item.title).toMatch(/[\u3400-\u9fff]/);
      expect(item.description).toMatch(/[\u3400-\u9fff]/);
      expect(item.canonical).toBe(route);
    }
  });

  it("gives every product decision page independent metadata and canonical", () => {
    const expected = {
      "/features": /K-Link 核心功能/,
      "/team": /团队小程序与数智化赋能方案/,
      "/about": /关于客来宝|关于我们/,
    } as const;

    for (const [route, titlePattern] of Object.entries(expected)) {
      const item = Reflect.get(ROUTE_METADATA, route) as
        | { title: string; description: string; canonical: string }
        | undefined;
      expect(item, route).toBeDefined();
      expect(item?.title, route).toMatch(titlePattern);
      expect(item?.description, route).toMatch(/[\u3400-\u9fff]/);
      expect(item?.canonical, route).toBe(route);
    }
  });

  it("publishes independent package metadata without commerce schema promises", () => {
    const item = ROUTE_METADATA["/media/packages"];
    expect(item).toEqual(expect.objectContaining({
      canonical: "/media/packages",
      title: expect.stringMatching(/媒体套餐/),
      description: expect.stringMatching(/四套会员专享/),
    }));
    const metadata = createPageMetadata("/media/packages");
    expect(new URL(String(metadata.openGraph?.url)).pathname).toBe("/media/packages");
  });

  it("uses /media as the only consultant canonical and Open Graph URL", () => {
    const media = Reflect.get(ROUTE_METADATA, "/media") as
      | { title: string; description: string; canonical: string }
      | undefined;

    expect(media).toEqual(
      expect.objectContaining({
        canonical: "/media",
        title: expect.stringMatching(/媒体发稿与团队 IP 内容服务/),
        description: expect.stringMatching(/专业表达|内容顾问/),
      }),
    );
    const openGraphUrl = createPageMetadata("/media" as never).openGraph?.url;
    expect(new URL(String(openGraphUrl)).pathname).toBe("/media");

    for (const retired of [
      "/services",
      "/for/direct-sales",
      "/for/insurance",
      "/for/securities",
      "/method",
    ]) {
      expect(PUBLIC_ROUTES).not.toContain(retired);
      expect(Reflect.has(ROUTE_METADATA, retired), retired).toBe(false);
    }
  });

  it("uses the about page as the public contact destination", () => {
    expect(PUBLIC_ROUTES).not.toContain("/contact");
    expect(Reflect.has(ROUTE_METADATA, "/contact")).toBe(false);
    expect(ROUTE_METADATA["/about"].canonical).toBe("/about");
  });

  it("permanently redirects the retired contact route to the about contact section", async () => {
    const redirects = await nextConfig.redirects?.();

    expect(redirects).toContainEqual({
      source: "/contact",
      destination: "/about#contact",
      permanent: true,
    });
  });

  it("points Open Graph metadata at the generated image route", () => {
    expect(createPageMetadata("/").openGraph?.images).toEqual([
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "客来宝｜K-Link 一站式拓客工具系统",
      },
    ]);
    expect(createPageMetadata("/").openGraph?.siteName).toBe("客来宝");
  });
});
