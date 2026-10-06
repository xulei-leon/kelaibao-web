import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { MobileContactBar } from "@/components/mobile-contact-bar";
import { SiteFooter } from "@/components/site-footer";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

type HomePageModule = {
  default: () => ReactNode | Promise<ReactNode>;
};

async function renderHomePage() {
  const page = await vi.importActual<HomePageModule>("@/app/page");
  return renderToStaticMarkup(await page.default());
}

function expectInOrder(html: string, markers: readonly string[]) {
  let previousIndex = -1;
  for (const marker of markers) {
    const index = html.indexOf(marker);
    expect(index, marker).toBeGreaterThan(previousIndex);
    previousIndex = index;
  }
}

describe("M3-04 homepage and shared public shell SSR", () => {
  it("renders the approved K-Link homepage sales path in order", async () => {
    const html = await renderHomePage();

    expect(html).toContain("一站式拓客与团队数智化工具系统");
    expect(html).toContain("体验K-Link小程序");
    expect(html).toContain("一个人能用，一个团队也能用");
    expect(html).toContain("专业介绍，分享更可靠");
    expect(html).toContain("持续获得自然连接</p>");
    expect(html).not.toMatch(/先领10份发群资料|一支队伍也能用|一页介绍，转发就带上|持续获得自然连接。/);
    expect(html).toContain("熟人名单总会用完，陌生人才是下一站");
    expectInOrder(html, [
      "一站式拓客与团队数智化工具系统",
      "全套工具",
      ">查找<",
      ">转发<",
      ">信任<",
      ">实时<",
      ">复制<",
      "重构你的展业效率",
      "媒体服务，一篇能用很久",
    ]);

    for (const group of ["内容工具", "展示工具", "效率工具", "团队工具"]) {
      expect(html).toContain(group);
    }
    expect(html).not.toMatch(/今日热点|每日健康|未来周报|商业洞察|资源集市|人脉社群圈/);
    expect(html).toContain("专为营销人，打造的轻社交经营系统");
    expect(html).toContain("开启你的社群获客助手");
    expect(html).toContain("0 隐私采集");
    expect(html).toContain("私域资产完全归你");
  });

  it("keeps workbook-only homepage content without exposing a Web product backend", async () => {
    const html = await renderHomePage();

    expect(html).toContain('href="/about#contact"');
    expect(html).not.toMatch(/继续了解|查看新闻|查看案例|了解团队方案/);

    expect(html).not.toMatch(
      /href="\/(?:login|admin|dashboard|account)(?:\/|#|\?|\")/i,
    );
    expect(html).not.toMatch(
      /href="[^"]*(?:pricing|checkout|payment|付款|支付|价格)[^"]*"/i,
    );
    expect(html).not.toMatch(/公众账号|Dashboard/i);
    expect(html).not.toMatch(/100\+|10万\+|99\.99%/);
    expect(html).not.toMatch(/合作伙伴.{0,24}(?:Logo|标志)|客户.{0,24}Logo/i);
    expect(html).not.toMatch(/产品截图|后台截图|数据看板截图/);
    expect(html).not.toContain("cta--wechat-primary");
  });

  it("keeps footer links and makes the mobile global CTA a product trial", () => {
    const footer = renderToStaticMarkup(<SiteFooter />);
    const mobileBar = renderToStaticMarkup(<MobileContactBar />);

    for (const href of [
      "/about#contact",
      "/privacy",
      "/terms",
      "/disclaimer",
      "/results",
    ]) {
      expect(footer, href).toContain(`href="${href}"`);
    }
    expect(mobileBar).toContain("免费体验");
    expect(mobileBar).toContain("cta--product-primary");
    expect(mobileBar).not.toContain("cta--wechat-primary");
    expect(footer).toContain('href="/media">团队方案</a>');
    expect(footer).toContain('href="/news">新闻动态</a>');
  });
});
