import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { createPageMetadata } from "@/lib/route-metadata";
import { buildStaticPageStructuredData } from "@/server/discovery/metadata";

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
  it("renders the FR-27 homepage showcase and shares its headline with search metadata", async () => {
    const html = await renderPage("@/app/page");
    const page = new DOMParser().parseFromString(html, "text/html");
    const headline = "你手机里躺着几百个微信群、几万个陌生群友——真正认识你的，有几个？";
    expect(page.querySelector("h1")?.textContent).toBe(headline);
    const metadata = createPageMetadata("/");
    expect(metadata.title).toBe(`${headline}｜客来宝 K-Link`);
    expect(metadata.openGraph?.title).toBe(metadata.title);
    expect(metadata.alternates?.canonical).toBe("/");
    expect(buildStaticPageStructuredData("/", "https://site.example")[0].name).toBe(metadata.title);
    const showcase = page.querySelector(".content-showcase")!;
    expect(showcase.textContent).toContain("每天真实更新的一篇早报+一条有趣话题+一张每日一图+多个发群发圈可用的好内容，可直接使用。");
    expect(Array.from(showcase.querySelectorAll("li"), (item) => item.textContent)).toEqual(["早报", "有趣话题", "每日一图", "发群发圈好内容"]);
    const link = showcase.querySelector("a")!;
    expect(link.textContent).toContain("打开小程序查看");
    expect(link.getAttribute("href")).toBe("/about#contact");
    expect(showcase.querySelector("time")).toBeNull();
    expect(page.querySelector(".hero .tag")?.textContent).toBe("一站式拓客与团队效率工具系统");
    expect(page.querySelector(".hero p")?.textContent).toBe("客来宝每天给你现成的好内容，转发就带上你。1分钟挑一条，让群里的陌生人记住你、找到你。");
    expect(html).toContain("媒体全程服务与补贴");
    expect(html).not.toMatch(/数字不说谎|媒体服务5折|你手机里有那么多微信群/);
  });
  it("uses the FR-27 trial reassurance and four-paragraph company introduction", async () => {
    const trial = await renderPage("@/app/trial/page");
    const about = new DOMParser().parseFromString(await renderPage("@/app/about/page"), "text/html");
    for (const text of ["会员专区9+内容模块（日更/周更）", "给谨慎的你", "先感受，再决定", "不用先交钱，也不用先听完所有介绍。打开发现页，挑一篇你愿意读的，读完再决定分不分享。觉得顺手，你自然会每天打开它。", "先免费用着。觉得值，再开通，不迟。"]) expect(trial).toContain(text);
    expect(trial).not.toMatch(/会员专区8\+|你不需要向任何人推销客来宝|当你发现每天都需要它，再看年费不迟/);
    const paragraphs = about.querySelectorAll("#story p.intro");
    expect(paragraphs).toHaveLength(4);
    expect(paragraphs[0].textContent).toContain("小未来商务服务（深圳）有限公司运营的数字化经营服务品牌");
    expect(paragraphs[1].textContent).toContain("每位成员使用各自的联系入口开展经营");
    expect(paragraphs[2].textContent).toContain("人物专访、团队报道、品牌与活动传播服务");
    expect(paragraphs[3].textContent).toContain("让每一位认真经营的人，更容易表达专业、积累信任、建立合作");
    const contact = about.querySelector("#contact")!;
    expect(contact.querySelectorAll(".contact-qr .card")).toHaveLength(4);
    expect(contact.textContent).toContain("微信扫码体验K-Link。");
    expect(contact.textContent).not.toContain("移动端可长按识别");
  });
  it("follows the prototype homepage problem, mechanism, audience and benefits path", async () => {
    const html = await renderPage("@/app/page");
    inOrder(html, ["你手机里躺着几百个微信群", "今日内容橱窗", "熟人名单总会用完", "不用加好友，先让人记住你", "通过微信拓客的人，她们先开始了", "你是哪一种", "每天省下1小时", "不用先弄懂所有功能"]);
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
