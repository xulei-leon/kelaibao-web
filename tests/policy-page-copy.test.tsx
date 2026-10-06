import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import DisclaimerPage from "@/app/disclaimer/page";
import PrivacyPage from "@/app/privacy/page";
import ResultsPage from "@/app/results/page";
import TermsPage from "@/app/terms/page";
import { SiteFooter } from "@/components/site-footer";
import { ROUTE_METADATA } from "@/lib/route-metadata";

describe("friendly policy page copy", () => {
  it.each([
    [PrivacyPage, "隐私保护原则"],
    [TermsPage, "技术中立原则"],
    [DisclaimerPage, "用户行为规范"],
    [ResultsPage, "效果与责任说明"],
  ])("renders the approved policy page name", (Page, title) => {
    const html = renderToStaticMarkup(createElement(Page));
    expect(html).toContain(`<h1>${title}</h1>`);
  });

  it("uses the approved names without changing policy URLs", () => {
    const footer = renderToStaticMarkup(<SiteFooter />);
    expect(footer).toContain('href="/privacy">隐私保护原则</a>');
    expect(footer).toContain('href="/terms">技术中立原则</a>');
    expect(footer).toContain('href="/disclaimer">用户行为规范</a>');
    expect(footer).toContain('href="/results">效果与责任说明</a>');
    expect(footer).not.toContain('href="/disclaimer#results"');

  });

  it("uses matching metadata titles and unchanged canonicals", () => {
    expect(ROUTE_METADATA["/privacy"]).toEqual(expect.objectContaining({
      title: "隐私保护原则｜客来宝",
      canonical: "/privacy",
    }));
    expect(ROUTE_METADATA["/terms"]).toEqual(expect.objectContaining({
      title: "技术中立原则｜客来宝",
      canonical: "/terms",
    }));
    expect(ROUTE_METADATA["/disclaimer"]).toEqual(expect.objectContaining({
      title: "用户行为规范｜客来宝",
      canonical: "/disclaimer",
    }));
    expect(ROUTE_METADATA["/results"]).toEqual(expect.objectContaining({
      title: "效果与责任说明｜客来宝",
      canonical: "/results",
    }));
  });

  it("presents the approved user behavior rules in the simple text layout", () => {
    const html = renderToStaticMarkup(<DisclaimerPage />);

    for (const rule of [
      "发布虚假信息",
      "进行违法违规宣传",
      "侵害他人权益",
      "从事任何违反法律法规的行为",
    ]) {
      expect(html).toMatch(new RegExp(`<li>\\d+\\. ${rule}</li>`));
    }

    expect(html).toContain('id="principles"');
    expect(html).toContain('id="results"');
    expect(html).toContain("真实内容建立信任，通过长期价值创造连接");
    expect(html).toContain("限制功能使用、下架相关内容");
    expect(html).not.toContain("<h2>");
    expect(html).not.toContain("本页目录");
  });

  it("publishes the standalone results and responsibility statement", () => {
    const html = renderToStaticMarkup(<ResultsPage />);

    expect(html).toContain("客来宝提供数字化工具和技术支持");
    expect(html).toContain("个人投入程度、行业环境、市场变化、执行方式");
    expect(html).toContain("不承诺任何固定收益、客户数量或商业结果");
    expect(html).toContain("用户应根据自身情况合理使用平台工具");
    expect(html).not.toContain("本页目录");
  });
});
