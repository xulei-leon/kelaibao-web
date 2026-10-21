import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import FeaturesPage from "@/app/features/page";
import HomePage from "@/app/page";
import MediaPage from "@/app/media/page";
import TeamPage from "@/app/team/page";
import { PublicContentList } from "@/components/public-content-list";
import { SiteFooter } from "@/components/site-footer";
import { createPageMetadata, ROUTE_METADATA } from "@/lib/route-metadata";
import {
  buildPublicListMetadata,
  buildPublicListStructuredData,
} from "@/server/discovery/metadata";

function h1Count(html: string) {
  return html.match(/<h1(?:\s|>)/g)?.length ?? 0;
}

describe("M5-02 search semantics and contextual links", () => {
  it("freezes the approved core-page metadata and Open Graph copy", () => {
    const expected = {
      "/": {
        title: "你手机里有那么多微信群，有多少群友真正认识你？｜客来宝 K-Link",
        description:
          "客来宝 K-Link（klinktool.com）由小未来商务服务（深圳）有限公司技术运营，为带团队的经营者提供内容与工具服务：每天更新的内容库，转发时带上自己的数字名片，团队内容实时同步；以及人物专访、团队报道、活动发布等媒体发稿服务。系统坚守不采集隐私、不触碰团队、不干预业务三项中立原则，让每个人体面地持续被看见、被信任、被找到。",
      },
      "/features": {
        title: "会员服务｜每天有现成内容，转发就带上你。｜客来宝 K-Link",
        description:
          "客来宝年费会员599元/年：现成内容、数字名片、访客轨迹、团队小程序等九项权益。先免费试用，再决定。",
      },
      "/team": {
        title: "团队效率｜一个人会卖货，不代表整个团队都会。｜客来宝 K-Link",
        description:
          "团队长整理一次，队员一键取用统一内容，各自带自己的二维码。了解 K-Link 团队小程序的内容复制与成员分享归属。",
      },
      "/media": {
        title: "媒体服务｜发一篇，能用很久。｜客来宝媒体",
        description:
          "个人专访、团队报道、活动发布：从选题沟通、专业表达、撰稿审稿到协调发布，了解客来宝媒体服务与四档咨询套餐。",
      },
    } as const;

    for (const [route, copy] of Object.entries(expected)) {
      const key = route as keyof typeof expected;
      expect(ROUTE_METADATA[key]).toMatchObject({
        ...copy,
        canonical: route,
      });
      expect(createPageMetadata(key).openGraph).toMatchObject(copy);
    }
  });

  it("renders one approved H1 per core page while retaining supporting copy", () => {
    const pages = [
      {
        html: renderToStaticMarkup(<HomePage />),
        h1: "你手机里有那么多微信群，有多少群友真正认识你？",
        support: "免费体验K-Link",
      },
      {
        html: renderToStaticMarkup(<FeaturesPage />),
        h1: "每天有现成内容，转发就带上你。",
        support: "599元",
      },
      {
        html: renderToStaticMarkup(<TeamPage />),
        h1: "一个人会卖货，不代表整个团队都会。",
        support: "团队长整理一次",
      },
      {
        html: renderToStaticMarkup(<MediaPage />),
        h1: "发一篇，能用很久。",
        support: "个人专访、团队报道、活动发布",
      },
    ];

    for (const { html, h1, support } of pages) {
      expect(h1Count(html)).toBe(1);
      expect(html).toContain(`<h1>${h1}</h1>`);
      expect(html).toContain(support);
    }
  });

  it("renders descriptive footer and contextual product links in SSR HTML", () => {
    const footer = renderToStaticMarkup(<SiteFooter />);
    for (const [href, label] of [["/trial", "试用会员"], ["/features", "会员服务"], ["/team", "团队效率"], ["/media", "媒体服务"], ["/news", "新闻动态"]]) {
      expect(footer).toContain(`href="${href}">${label}</a>`);
    }
    const home = renderToStaticMarkup(<HomePage />);
    for (const href of ["/trial", "/team", "/media"]) expect(home).toContain(`href="${href}"`);
  });

  it("retains news metadata and breadcrumbs with the operations headline", () => {
    const metadata = buildPublicListMetadata(
      "news",
      "https://www.example.cn",
      false,
    );
    expect(metadata).toMatchObject({
      title: "新闻动态｜客来宝",
      description:
        "查看客来宝、K-Link 产品、媒体服务及数字化展业相关的新闻、方法说明与行业观察。",
      alternates: { canonical: "https://www.example.cn/news" },
    });

    const structured = buildPublicListStructuredData(
      "news",
      "https://www.example.cn",
    );
    expect(structured.map((node) => node["@type"])).toEqual([
      "Organization",
      "WebSite",
      "BreadcrumbList",
    ]);
    expect(JSON.stringify(structured)).toContain("新闻动态");

    const list = renderToStaticMarkup(
      <PublicContentList contentType="news" items={[]} />,
    );
    expect(h1Count(list)).toBe(1);
    expect(list).toContain("先看懂，再决定。");
    expect(list).not.toMatch(/新闻与行业观察|新闻中心/);
  });
});
