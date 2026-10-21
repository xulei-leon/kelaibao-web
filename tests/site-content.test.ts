import {
  BRAND,
  GLOBAL_CLAIMS_BOUNDARY,
  PRIMARY_NAVIGATION,
  PROFESSIONS,
  REPRESENTATIVE_SAMPLES,
  SERVICES,
  WORKFLOW_STEPS,
} from "@/lib/site-content";
import { describe, expect, it } from "vitest";

type NamedContent = { title: string };
type FeatureGroup = NamedContent & {
  tools: readonly NamedContent[];
};

describe("central site content", () => {
  it("uses the confirmed brand and stable service/profession identifiers", () => {
    expect(BRAND).toEqual(
      expect.objectContaining({
        name: "客来宝",
        productName: "K-Link",
        mediaName: "客来宝媒体",
      }),
    );
    expect(BRAND.descriptor).toContain("拓客");
    expect(PRIMARY_NAVIGATION).toEqual([
      { label: "首页", href: "/" },
      { label: "试用会员", href: "/trial" },
      { label: "会员服务", href: "/features" },
      { label: "团队效率", href: "/team" },
      { label: "媒体服务", href: "/media" },
      { label: "新闻动态", href: "/news" },
      { label: "关于我们", href: "/about" },
    ]);
    expect(SERVICES.map(({ id }) => id)).toEqual([
      "positioning",
      "content-assets",
      "ongoing-advisory",
    ]);
    expect(PROFESSIONS.map(({ id }) => id)).toEqual([
      "direct-sales",
      "insurance",
      "securities",
    ]);
    expect(new Set(SERVICES.map(({ id }) => id))).toHaveLength(SERVICES.length);
    expect(new Set(PROFESSIONS.map(({ id }) => id))).toHaveLength(
      PROFESSIONS.length,
    );
  });

  it("defines the complete five-step human service workflow", () => {
    expect(WORKFLOW_STEPS.map(({ title }) => title)).toEqual([
      "了解现状",
      "确定定位",
      "建设内容",
      "规划推广",
      "阶段复盘",
    ]);
  });

  it("defines the five-stage K-Link journey and four complete tool groups", async () => {
    const siteContent = await import("@/lib/site-content");
    const journey = Reflect.get(siteContent, "FEATURE_JOURNEY_STAGES") as
      | readonly string[]
      | undefined;
    const groups = Reflect.get(siteContent, "FEATURE_GROUPS") as
      | readonly FeatureGroup[]
      | undefined;

    expect(journey).toEqual(["曝光", "获客", "信任", "成交", "沉淀"]);
    expect(groups?.map(({ title }) => title)).toEqual([
      "内容工具",
      "展示工具",
      "团队工具",
      "引流工具",
    ]);
    expect(groups?.map(({ tools }) => tools.map(({ title }) => title))).toEqual([
      ["今日热点", "每日健康", "未来周报", "商业洞察"],
      ["数字名片", "推广海报"],
      ["品牌专刊", "团队小程序"],
      ["资源集市", "人脉社群圈"],
    ]);

    const tools = groups?.flatMap(({ tools }) => tools) ?? [];
    expect(tools).toHaveLength(10);
    expect(new Set(tools.map(({ title }) => title))).toHaveLength(10);
  });

  it("defines four team challenges and three delivery guarantees", async () => {
    const siteContent = await import("@/lib/site-content");
    const challenges = Reflect.get(siteContent, "TEAM_CHALLENGES") as
      | readonly NamedContent[]
      | undefined;
    const guarantees = Reflect.get(
      siteContent,
      "TEAM_DELIVERY_GUARANTEES",
    ) as readonly NamedContent[] | undefined;

    expect(challenges?.map(({ title }) => title)).toEqual([
      "团队经验难复制",
      "品牌传播乱",
      "成员留存低",
      "管理缺数据",
    ]);
    expect(guarantees?.map(({ title }) => title)).toEqual([
      "需求诊断",
      "内容策划",
      "团队启动",
    ]);
  });

  it("keeps unsupported public proof out of the runtime content model", async () => {
    const runtimeContent = JSON.stringify(await import("@/lib/site-content"));

    expect(runtimeContent).not.toMatch(/100\+|10万\+|99\.99%/);
    expect(runtimeContent).not.toMatch(/合作伙伴.{0,24}(?:Logo|标志)|客户.{0,24}Logo/i);
  });

  it("keeps required claims boundaries explicit", () => {
    expect(GLOBAL_CLAIMS_BOUNDARY).toBe(
      "客来宝坚持真实表达、清晰合作与尊重授权，并与客户共同维护合理、透明的成果预期。",
    );
    expect(PROFESSIONS.find(({ id }) => id === "direct-sales")?.boundaries.join(" ")).toMatch(
      /产品功效|收入机会|团队收益|发展下线|快速致富/,
    );
    expect(PROFESSIONS.find(({ id }) => id === "insurance")?.boundaries.join(" ")).toMatch(
      /产品比较|投保建议|收益演示|机构审核/,
    );
    expect(PROFESSIONS.find(({ id }) => id === "securities")?.boundaries.join(" ")).toMatch(
      /证券推荐|买卖时点|收益预测|投资组合|个性化投资建议/,
    );
  });

  it("does not expose price, payment, account, or guaranteed-result fields", () => {
    const content = JSON.stringify({ SERVICES, PROFESSIONS });
    expect(content).not.toMatch(/"(price|paymentLink|accountUrl|guaranteedResult)"/i);
  });

  it("labels every representative deliverable as an illustrative sample", () => {
    expect(REPRESENTATIVE_SAMPLES).toHaveLength(3);
    for (const sample of REPRESENTATIVE_SAMPLES) {
      expect(sample.isIllustrative).toBe(true);
      expect(sample.disclaimer).toContain("示例结构");
      expect(sample.disclaimer).toContain("不代表真实客户案例");
    }
  });
});
