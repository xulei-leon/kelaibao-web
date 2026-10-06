import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

type PageModule = { default: () => ReactNode | Promise<ReactNode> };

async function renderPage(moduleId: string) {
  const page = await vi.importActual<PageModule>(moduleId);
  return renderToStaticMarkup(await page.default());
}

function expectInOrder(html: string, markers: readonly string[]) {
  let previous = -1;
  for (const marker of markers) {
    const current = html.indexOf(marker, previous + 1);
    expect(current, marker).toBeGreaterThan(previous);
    previous = current;
  }
}

const INTERNAL_RELEASE_COPY =
  /Preview|Production|测试二维码|不可用于正式|预览占位|发布前仍需完成扫码/;

describe("V3.3 copy and layout fidelity", () => {
  it("uses the V3.3 homepage sequence and retained story content", async () => {
    const html = await renderPage("@/app/page");

    expectInOrder(html, [
      "一站式拓客与团队数智化工具系统",
      "熟人名单总会用完，陌生人才是下一站",
      "全套工具",
      "专为营销人，打造的轻社交经营系统",
      ">查找<",
      ">转发<",
      ">信任<",
      ">实时<",
      ">复制<",
      "重构你的展业效率",
      "媒体服务，一篇能用很久",
      "开启你的社群获客助手",
    ]);

    for (const copy of [
      "四处找发圈/发群的素材",
      "内容底部自动链接",
      "陌生人点开链接",
      "会员专属数据反馈",
      "团队长统一配置品牌小程序",
      "价值内容",
      "社交传播",
      "建立信任",
      "识别意向",
      "团队复制",
      "专业新闻稿撰写",
      "风险回应",
      "打造团队IP",
      "让每一次分享，都成为一次有效连接",
    ]) expect(html, copy).toContain(copy);

    expect(html).not.toMatch(/继续了解|新闻动态|查看案例|关于我们/);
    expect(html).not.toMatch(INTERNAL_RELEASE_COPY);
  });

  it("renders five stages, the trial QR and nine V3.3 membership benefits", async () => {
    const html = await renderPage("@/app/features/page");

    expect(html.match(/class="feature-showcase"/g) ?? []).toHaveLength(0);
    for (const copy of [
      "曝光", "获客", "信任", "成交", "沉淀", "扫码可见所有工具，可体验",
      "每天能发各类内容", "转发带上你的联系方式", "数字名片", "被动获客",
      "我的私域", "行业专刊", "团队小程序", "媒体发稿套餐", "免费升级",
      "内容 · 展示 · 高效 · 团队",
    ]) expect(html, copy).toContain(copy);

    expect(html).not.toMatch(/适用场景|能力边界<\/dt>/);
    expect(html).not.toMatch(/今日热点|每日健康|未来周报|商业洞察|资源集市|人脉社群圈/);
    expect(html).not.toMatch(INTERNAL_RELEASE_COPY);
  });

  it("restores the workbook team problems, capabilities, mechanisms and delivery copy", async () => {
    const html = await renderPage("@/app/team/page");

    expectInOrder(html, [
      "为团队提供省时间、提效率、高复制的专属团队小程序",
      "从“个人精英”到“系统赋能”",
      "经验复制难",
      "品牌宣发乱",
      "团队留存低",
      "团队管理差",
      "K-Link赋能体系",
      "形象塑造，重塑团队IP价值",
      "定制化小程序，新人极速启动",
      "无痕链接，激活沉寂的人脉",
      "追踪访客轨迹，精准找到客户",
      "一个人厉害是能力",
      "让一万个人都会，才是领导力",
      "搭建可复制的团队小程序",
      "谁分享，客户就是谁的",
      "底层私域锁客技术",
      "交付与服务保障",
    ]);
    for (const copy of ["需求诊断与系统搭建", "内容全面策划设计", "团队启动"]) {
      expect(html).toContain(copy);
    }
    expect(html).not.toMatch(INTERNAL_RELEASE_COPY);
  });

  it("uses only the workbook media-center narrative and preserves legacy anchors", async () => {
    const html = await renderPage("@/app/media/page");

    expectInOrder(html, [
      "发一篇，能用很久",
      "你为什么需要媒体背书？",
      "为什么带团队的人需要媒体发稿",
      "让个人和团队一起被看见",
      "一站式发稿服务",
      "四套会员专享套餐",
      "开启你的媒体背书之路",
    ]);
    for (const copy of [
      "不是广告，是第三方说你", "一篇顶很久", "会员更省",
      "1.领导者持续发声", "2.成员成果被看见", "3.团队故事被传播",
      "选题", "撰稿", "审核", "发布", "追踪", "反馈",
      "百家主流媒体全覆盖",
      "查看客来宝 K-Link 媒体套餐",
    ]) expect(html, copy).toContain(copy);
    for (const anchor of ["services", "direct-sales", "insurance", "securities", "method"]) {
      expect(html).toContain(`id="${anchor}"`);
    }
    expect(html).not.toMatch(/三类顾问服务|适用人群|五步顾问方法|代表性交付|合作方式/);
    expect(html).not.toMatch(/不只是简单发稿，而是建立长期影响力|从“社交曝光”到“媒体背书”的转变|核心价值/);
    expect(html).not.toMatch(INTERNAL_RELEASE_COPY);
  });

  it("restores the complete About copy after removing the publication gate", async () => {
    const html = await renderPage("@/app/about/page");

    for (const copy of [
      "客来宝专注私域经营工具的研发",
      "由资深互联网软件技术专家与长期深耕微信社群经营场景的顾问联合打造",
      "让每一次连接都能体现专业、建立人设",
      "100+", "10万+", "100万+",
      "企业文化",
      "成为带团队的人长期可信赖的经营伙伴。",
      "用工具降低获客门槛，用内容提升专业表达，用数据驱动团队增长。",
      "让优秀经验实现规模化复制，让团队增长更加稳定、长久、可持续。",
      "安全与合规保障",
      "0隐私采集", "0业务干预", "100%私域归属",
      "杜绝泄露", "绝对保密",
      "新闻动态",
      "公司实景", "实景展示", "到访指引",
      "联系我们",
      "关注我们",
      ">小程序<", ">公众号<", ">视频号<", ">企业微信<",
    ]) expect(html, copy).toContain(copy);
    expect(html).toContain('id="contact"');

    expect(html).not.toMatch(INTERNAL_RELEASE_COPY);
    expect(html).not.toMatch(/可以放一些直销品牌|等有一些客户后插入/);
  });
});
