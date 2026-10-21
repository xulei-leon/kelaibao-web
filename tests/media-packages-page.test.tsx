import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

type PageModule = { default: () => ReactNode | Promise<ReactNode> };

describe("M5-03 media packages page", () => {
  it("renders four consultation-only packages with all approved prices", async () => {
    const page = await vi.importActual<PageModule>("@/app/media/packages/page");
    const html = renderToStaticMarkup(await page.default());

    for (const title of ["个人IP背书", "团队招商", "品牌与项目", "线下活动热播"]) {
      expect(html).toContain(title);
    }
    for (const price of ["¥698", "¥349", "¥798", "¥399", "¥898", "¥449", "¥1,776", "¥888", "¥3698", "¥3798", "¥3898", "¥5776"]) {
      expect(html).toContain(price);
    }
    expect(html.match(/会员补贴50%/g)).toHaveLength(4);
    expect(html).toContain("咨询媒体服务");
    expect(html).toContain('href="/about#contact"');
    expect(html).toContain('"@type":"WebPage"');
    expect(html).not.toMatch(/"@type":"(?:Product|Offer)"/);
    expect(html).not.toMatch(/href="[^"\s]*(?:checkout|payment|account|login|api)[^"\s]*"/i);
    expect(html).not.toMatch(/下单|立即购买|在线支付|结算/);
  });
});
