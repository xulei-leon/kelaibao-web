import { existsSync } from "node:fs";
import { join } from "node:path";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

type ProductPageModule = {
  default: () => ReactNode | Promise<ReactNode>;
};

async function renderPage(
  sourcePath: string,
  moduleId: string,
): Promise<string> {
  const absolutePath = join(process.cwd(), sourcePath);
  expect(existsSync(absolutePath), sourcePath).toBe(true);
  if (!existsSync(absolutePath)) return "";

  const page = await vi.importActual<ProductPageModule>(moduleId);
  return renderToStaticMarkup(await page.default());
}

function expectNoPublicBackend(html: string) {
  expect(html).not.toMatch(
    /href="\/(?:admin|login|dashboard|account)(?:\/|#|")/i,
  );
}

describe("M3-02 product decision page SSR", () => {
  it("renders the V3.3 five-stage journey, trial QR and nine membership benefits on /features", async () => {
    const html = await renderPage(
      "src/app/features/page.tsx",
      "@/app/features/page",
    );

    for (const stage of ["曝光", "获客", "信任", "成交", "沉淀"]) {
      expect(html).toContain(stage);
    }
    expect(html).toContain("从被看见，到被找到");
    expect(html).toContain("K-Link 小程序工具体验二维码");
    for (const benefit of [
      "每天能发各类内容",
      "转发带上你的联系方式",
      "数字名片",
      "被动获客",
      "我的私域",
      "行业专刊",
      "团队小程序",
      "媒体发稿套餐",
      "免费升级",
    ]) {
      expect(html).toContain(benefit);
    }
    expect(html).toContain("内容 · 展示 · 高效 · 团队");
    expect(html).not.toMatch(/今日热点|每日健康|未来周报|商业洞察|资源集市|人脉社群圈/);
    expect(html).not.toMatch(/产品能力/);
    expect(html).not.toMatch(/具体功能、数据范围和可用状态/);
    expectNoPublicBackend(html);
  });

  it("renders four team problems and three delivery guarantees on /team", async () => {
    const html = await renderPage("src/app/team/page.tsx", "@/app/team/page");

    for (const problem of [
      "经验复制难",
      "品牌宣发乱",
      "团队留存低",
      "团队管理差",
    ]) {
      expect(html).toContain(problem);
    }
    for (const guarantee of ["需求诊断与系统搭建", "内容全面策划设计", "团队启动"]) {
      expect(html).toContain(guarantee);
    }
    for (const capability of [
      "形象塑造，重塑团队IP价值",
      "定制化小程序，新人极速启动",
      "无痕链接，激活沉寂的人脉",
      "追踪访客轨迹，精准找到客户",
    ]) {
      expect(html).toContain(capability);
    }
    expect(html).not.toContain("团队方案边界");
    expect(html).not.toContain("团队登录、成员管理或业务数据看板");
    expectNoPublicBackend(html);
  });

  it("renders the complete company, proof, security, office, and contact copy on /about", async () => {
    const html = await renderPage("src/app/about/page.tsx", "@/app/about/page");

    expect(html).toContain("客来宝");
    expect(html).toContain("K-Link");
    expect(html).toContain("企业文化");
    expect(html).toMatch(/安全|隐私/);
    expect(html).toMatch(/联系(?:我们|客来宝)/);
    expect(html).toMatch(/100\+.*10万\+.*100万\+/s);
    expect(html).toMatch(/0隐私采集.*0业务干预.*100%私域归属/s);
    expect(html).not.toContain("合作伙伴/服务案例");
    expect(html).toMatch(/公司实景.*办公室场景.*到访指引/s);
    expectNoPublicBackend(html);
  });
});
