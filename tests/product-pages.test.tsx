import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import FeaturesPage from "@/app/features/page";
import TrialPage from "@/app/trial/page";
import TeamPage from "@/app/team/page";
import AboutPage from "@/app/about/page";

describe("FR-26 product decision pages", () => {
  it("describes membership and free trial without exposing a Web backend or checkout", () => {
    for (const Page of [FeaturesPage, TrialPage]) {
      const html = renderToStaticMarkup(<Page />);
      expect(html).toContain('href="/about#contact"');
      expect(html).not.toMatch(/href="\/(?:admin|login|dashboard|account|checkout|payment)(?:\/|#|\?")/i);
      expect(html).not.toMatch(/"@type":"(?:Product|Offer)"/);
    }
  });
  it("routes the team CTA to consultation and keeps member attribution explanatory", () => {
    const html = renderToStaticMarkup(<TeamPage />);
    expect(html).toContain("咨询团队方案"); expect(html).toContain('href="/about#contact"');
    expect(html).toContain("谁分享，客户就是谁的");
    expect(html).not.toMatch(/<form|href="\/(?:admin|account|dashboard)/);
  });
  it("retains office lightboxes and four contact channels without fabricated case studies", () => {
    const html = renderToStaticMarkup(<AboutPage />);
    expect(html).toContain("查看办公室场景大图"); expect(html).toContain("查看到访指引大图");
    expect(html).toContain('id="contact"'); expect(html).not.toMatch(/待提供真实|视频位|预约/);
    expect(html.match(/src="\/wechat\//g)).toHaveLength(4);
  });
});
