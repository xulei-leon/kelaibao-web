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

describe("M4-04 owner-approved public-site update", () => {
  it("uses the supplied logo, owner palette contract, and media-center IA", () => {
    const header = html(<SiteHeader />);
    const footer = html(<SiteFooter />);

    expect(header).toContain('src="/brand/kelaibao-k-link-logo.png"');
    expect(header).toContain("K-Link 一站式拓客工具系统");
    expect(header).not.toContain("一站式拓客工具系统与客来宝媒体");
    expect(header).toContain('href="/media">媒体服务</a>');
    expect(footer).toContain("内容赋能 · 资源链接 · 商机互联");
    expect(footer).toContain('href="/media">团队方案</a>');
    expect(footer).not.toContain('href="/cases">案例</a>');
    for (const label of ["隐私保护原则", "技术中立原则", "用户行为规范", "效果与责任说明"]) {
      expect(footer).toContain(label);
    }
  });

  it("implements the accepted homepage copy and removes standalone boundary cards", () => {
    const page = html(<HomePage />);
    expect(page).toContain("一站式拓客与团队数智化工具系统");
    expect(page).toContain("把每天至少1小时的重复工作，变成1分钟");
    expect(page).toContain("专业新闻稿撰写");
    expect(page).toContain("官方媒体");
    expect(page).not.toContain("产品与传播边界");
    expect(page).not.toContain("实际效果受内容、渠道、受众、执行与平台规则影响");
    expect(page).not.toContain("实际效果受使用方式与执行情况影响");
  });

  it("updates features and team copy while removing standalone boundary modules", () => {
    const features = html(<FeaturesPage />);
    const team = html(<TeamPage />);

    expect(features).toContain("客来宝(K-Link Future)会员能获得什么");
    expect(features).not.toContain("产品能力边界");
    expect(features).not.toContain("具体功能、数据范围和可用状态");
    expect(team).toContain("每天节省 1 小时，一年多出 2 个月，实现团队带教与业绩的倍增");
    expect(team).toContain("谁用就是谁的联系方式<br/>");
    expect(team).not.toContain("谁用就是谁的联系方式。<br/>");
    expect(team).toContain("底层私域锁客技术");
    expect(team).toContain("公平、透明、隔离");
    expect(team).not.toContain("团队方案边界");
    expect(team).not.toContain("实际效果取决于团队基础、使用频率与执行情况");
    expect(team).not.toContain("实际归属、访客线索和数据范围以产品规则、用户授权与第三方平台限制为准");
  });

  it("updates media, about, contact and approved candidate assets", async () => {
    const mediaModule = await vi.importActual<{ default: () => ReactNode }>("@/app/media/page");
    const media = html(mediaModule.default());
    const about = html(<AboutPage />);

    expect(media).toContain("咨询媒体报道");
    expect(media).toContain("为什么带团队的人需要媒体发稿");
    expect(media).toContain("百家主流媒体全覆盖");
    expect(media).not.toContain("以下为审阅稿提供的部分媒体示例");
    expect(media).not.toContain("可对接的媒体范围以当期项目清单、媒体审核与实际发布结果为准");
    expect(media).not.toContain("具体收录、排序与展示由搜索平台决定");
    expect(media).toContain("具体媒体清单、审核条件与反馈数据由实际项目和平台决定");
    expect(media.match(/media-problem-icon/g)).toHaveLength(4);
    for (const outlet of ["今日头条", "新浪网", "腾讯网", "搜狐网", "网易网", "凤凰网", "长沙晚报", "郑州广播电视报", "江西快报", "江苏青年网", "济南日报"]) {
      expect(media).toContain(outlet);
    }
    expect(about).toContain("<h1>关于我们</h1>");
    expect(about).toContain("更专业、更高效、更可持续</p>");
    expect(about).not.toContain("更专业、更高效、更可持续。</p>");
    expect(about).toContain("<h2>公司介绍</h2>");
    for (const paragraph of [
      "客来宝专注私域经营工具的研发",
      "由资深互联网软件技术专家与长期深耕微信社群经营场景的顾问联合打造",
      "客来宝旗下小程序K-Link将内容、数据与团队运营能力深度结合",
      "从个人拓客到团队运营，从内容传播到客户沉淀",
    ]) expect(about).toContain(`<p>${paragraph}`);
    expect(about).not.toContain("合作伙伴/服务案例");
    expect(about).toContain("公司实景");
    expect(about).not.toContain("/brand/office-scenes.png");
    expect(about).not.toContain("/brand/arrival-guide.webp");
    expect(about).toContain("查看办公室场景大图");
    expect(about).toContain("查看到访指引大图");
    expect(about).toContain("点击查看");
    expect(about).not.toContain("数字创新中心 B 座");
    expect(about).not.toContain("从 E 门进入大堂");
    expect(about).not.toContain("前往 18 层");
    expect(about).toContain('id="contact"');
    expect(about).toContain("企业微信");
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
