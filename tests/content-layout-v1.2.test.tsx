import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

type PageModule = { default: () => ReactNode | Promise<ReactNode> };
async function renderPage(moduleId: string) {
  const page = await vi.importActual<PageModule>(moduleId);
  return renderToStaticMarkup(await page.default());
}
function inOrder(html: string, markers: string[]) {
  let previous = -1;
  for (const marker of markers) { const current = html.indexOf(marker, previous + 1); expect(current, marker).toBeGreaterThan(previous); previous = current; }
}

describe("FR-26 operations content and layout", () => {
  it("follows the prototype homepage problem, mechanism, audience and benefits path", async () => {
    const html = await renderPage("@/app/page");
    inOrder(html, ["你手机里有那么多微信群", "熟人名单总会用完", "不用加好友，先让人记住你", "数字不说谎", "你是哪一种", "每天省下1小时", "不用先弄懂所有功能"]);
    for (const value of ["挑一条", "转出去", "被记住", "被找到", "10000+", "数字名片", "访客轨迹"]) expect(html).toContain(value);
    expect(html).not.toMatch(/Preview|Production|测试二维码|后台截图/);
  });
  it("separates trial comparison from the nine member benefits", async () => {
    const member = await renderPage("@/app/features/page");
    const trial = await renderPage("@/app/trial/page");
    for (const value of ["599元", "数字名片", "被动获客入口", "访客轨迹", "行业专刊", "团队小程序", "媒体服务5折", "免费升级"]) expect(member).toContain(value);
    expect(member).toContain("不承诺获客数量与收益");
    expect(trial).toContain("免费试用"); expect(trial).toContain("¥599/年");
    expect(trial).toContain('role="region"'); expect(trial).toContain('scope="col"');
    expect(trial).toContain("访客轨迹VIP可见");
  });
  it("explains team problems, content reuse and member attribution in order", async () => {
    const html = await renderPage("@/app/team/page");
    inOrder(html, ["一个人会卖货", "经验复制难", "品牌宣发乱", "新人启动慢", "管理靠吼", "激活老队员", "整理一次，全员复制", "谁分享，客户就是谁的", "工具解决效率，媒体解决面子"]);
    expect(html).toContain("统一的是内容，独立的是每个人的客户");
  });
  it("keeps all five inbound media migration anchors while updating the narrative", async () => {
    const html = await renderPage("@/app/media/page");
    inOrder(html, ["发一篇，能用很久", "四档套餐", "你只管讲故事", "常见问题", "你的故事，值得一次正式的表达"]);
    for (const anchor of ["services", "direct-sales", "insurance", "securities", "method"]) expect(html).toContain(`id="${anchor}"`);
    expect(html).toContain('href="/media/packages"'); expect(html).toContain("是否刊发取决于选题与媒体审核");
  });
  it("keeps company principles and contact channels without prototype placeholders", async () => {
    const html = await renderPage("@/app/about/page");
    for (const value of ["我们提供工具，连接由你决定", "专注私域经营工具的研发", "企业文化", "0隐私采集", "0业务干预", "100%私域归属", "10000+", "公司实景", "到访指引", "20个常见问题"]) expect(html).toContain(value);
    for (const name of ["k-link-mini-program", "kelaibao-official-account", "kelaibao-video-channel", "kelaibao-enterprise-wechat"]) expect(html).toContain(`/wechat/${name}-qr.png`);
    expect(html).not.toMatch(/待提供|视频位|10万\+|https:\/\/klinktool.com\/about/);
  });
});
