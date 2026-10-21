import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import AboutPage from "@/app/about/page";
import DisclaimerPage from "@/app/disclaimer/page";
import FeaturesPage from "@/app/features/page";
import HomePage from "@/app/page";
import PrivacyPage from "@/app/privacy/page";
import TeamPage from "@/app/team/page";
import TermsPage from "@/app/terms/page";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

function html(node: ReactNode) {
  return renderToStaticMarkup(node);
}

describe("FR-26 owner content and retained policy principles", () => {
  it("uses the operations logo and shared policy navigation", () => {
    const header = html(<SiteHeader />); const footer = html(<SiteFooter />);
    expect(header).toContain('/brand/kelaibao-operations-logo.png');
    for (const value of ["试用会员", "会员服务", "团队效率", "媒体服务"]) expect(header).toContain(value);
    for (const value of ["隐私保护原则", "技术中立原则", "用户行为规范", "效果与责任说明"]) expect(footer).toContain(value);
    expect(footer).toContain("让好内容，帮你认识更多人。");
  });
  it("preserves accessible office and contact entry points", () => {
    const about = html(<AboutPage />);
    expect(about).toContain("查看办公室场景大图"); expect(about).toContain("查看到访指引大图");
    expect(about).toContain('id="contact"'); expect(about).toContain('id="faq"');
    expect(about.match(/<details>/g)).toHaveLength(20);
  });

  it("publishes the approved policy principles", () => {
    const privacy = html(<PrivacyPage />);
    const terms = html(<TermsPage />);
    const disclaimer = html(<DisclaimerPage />);

    expect(privacy).toContain("<h1>隐私保护原则</h1>");
    expect(privacy).toContain("最小必要、用户自主、安全透明");
    expect(privacy).toContain("不会获取、读取或建立用户手机通讯录");
    expect(terms).toContain("<h1>技术中立原则</h1>");
    expect(terms).toContain("提供工具，不参与业务");
    expect(disclaimer).toContain("<h1>用户行为规范</h1>");
    expect(disclaimer).toContain("真实、健康、有价值的数字化表达方式");
    expect(disclaimer).toContain("限制功能使用、下架相关内容");
  });
});
