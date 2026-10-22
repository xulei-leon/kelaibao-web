import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import HomePage from "@/app/page";
import { MobileContactBar } from "@/components/mobile-contact-bar";
import { SiteFooter } from "@/components/site-footer";
vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

describe("FR-26 homepage and global shell", () => {
  it("renders the operations headline with trial, team and media paths", () => {
    const html = renderToStaticMarkup(<HomePage />);
    expect(html).toContain("你手机里躺着几百个微信群、几万个陌生群友——真正认识你的，有几个？");
    for (const path of ["/trial", "/team", "/media", "/about#contact"]) expect(html).toContain(`href="${path}"`);
    expect(html).toContain("免费体验K-Link");
  });
  it("keeps marketing pages independent of a public Web product backend", () => {
    const html = renderToStaticMarkup(<HomePage />);
    expect(html).not.toMatch(/href="\/(?:login|admin|dashboard|account|checkout|payment)(?:\/|#|\?|\")/i);
    expect(html).not.toMatch(/<form|产品截图|后台截图|数据看板截图/);
  });
  it("preserves contact and policy links and the mobile product trial", () => {
    const footer = renderToStaticMarkup(<SiteFooter />);
    for (const path of ["/trial", "/features", "/team", "/media", "/media/packages", "/news", "/about#contact", "/privacy", "/terms", "/disclaimer", "/results"]) expect(footer).toContain(`href="${path}"`);
    expect(footer).toContain("让好内容，帮你认识更多人。"); expect(footer).toContain('href="/media">媒体服务</a>');
    const bar = renderToStaticMarkup(<MobileContactBar />);
    expect(bar).toContain("免费体验"); expect(bar).toContain("cta--product-primary"); expect(bar).not.toContain("cta--wechat-primary");
  });
});
