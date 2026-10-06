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
        title: "客来宝 K-Link｜团队内容协同与微信社群获客工具",
        description:
          "客来宝 K-Link（klinktool.com）由小未来商务服务（深圳）有限公司技术运营，为带团队的经营者提供内容与工具服务：每天更新的内容库，转发时带上自己的数字名片，团队内容实时同步；以及人物专访、团队报道、活动发布等媒体发稿服务。系统坚守不采集隐私、不触碰团队、不干预业务三项中立原则，让每个人体面地持续被看见、被信任、被找到。",
      },
      "/features": {
        title: "K-Link 核心功能｜内容工具、数字名片与团队小程序",
        description:
          "了解 K-Link 从曝光、获客、信任、成交到沉淀的五阶段路径，扫码体验小程序，并查看九项会员权益。",
      },
      "/team": {
        title: "团队小程序与数智化赋能方案｜K-Link",
        description:
          "了解 K-Link 如何通过品牌专刊、团队小程序、成员分享归属和三类交付保障支持团队经验复制。",
      },
      "/media": {
        title: "媒体发稿与团队 IP 内容服务｜客来宝媒体",
        description:
          "了解客来宝媒体如何通过专业表达、新闻稿、公开传播与持续内容沉淀，帮助个人和团队建立可信的公开信息。",
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
        h1: "一站式拓客与团队数智化工具系统",
        support: "体验K-Link小程序",
      },
      {
        html: renderToStaticMarkup(<FeaturesPage />),
        h1: "从被看见，到被找到",
        support: "曝光",
      },
      {
        html: renderToStaticMarkup(<TeamPage />),
        h1: "为团队提供省时间、提效率、高复制的专属团队小程序",
        support: "专为带团队的人打造",
      },
      {
        html: renderToStaticMarkup(<MediaPage />),
        h1: "发一篇，能用很久",
        support: "个人专访 · 团队报道 · 活动发布 · 全国品宣",
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
    expect(footer).toContain('href="/features">K-Link 产品功能</a>');
    expect(footer).toContain('href="/team">团队方案</a>');
    expect(footer).toContain('href="/media">团队方案</a>');
    expect(footer).toContain('href="/news">新闻动态</a>');

    const home = renderToStaticMarkup(<HomePage />);
    for (const [href, label] of [
      ["/features", "查看内容工具"],
      ["/features", "查看展示工具"],
      ["/features", "查看效率工具"],
      ["/features", "查看团队工具"],
      ["/media", "查看媒体发稿"],
    ]) {
      expect(home).toContain(`href="${href}"`);
      expect(home).toContain(label);
    }

    const team = renderToStaticMarkup(<TeamPage />);
    expect(team.match(/id="team-mini-program"/g)).toHaveLength(1);
    expect(team.match(/id="member-attribution"/g)).toHaveLength(1);
  });

  it("uses one approved news-list name in metadata, H1, and structured data", () => {
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
    expect(list).toContain("新闻动态");
    expect(list).not.toMatch(/新闻与行业观察|新闻中心/);
  });
});
