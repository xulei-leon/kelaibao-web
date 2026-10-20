import { ContentTeasers } from "@/components/content-teasers";
import Link from "next/link";

import { MiniProgramTrialButton } from "@/components/mini-program-trial";
import { QrCodeCard } from "@/components/qr-code-card";
import { VisualAssetSlot } from "@/components/visual-asset-slot";
import { StaticPageStructuredData } from "@/components/static-page-structured-data";
import { PageHero } from "@/components/ui/page-hero";
import { Section } from "@/components/ui/section";
import { createPageMetadata } from "@/lib/route-metadata";
import { getVisualAsset, type VisualAssetId } from "@/content/visual-assets";
import { MINI_PROGRAM_TRIAL } from "@/lib/site-config";
import { ArrowRight, Eye, FileText, Megaphone, Network, Radar, Search, Send, ShieldCheck, Target, UsersRound } from "lucide-react";

export const metadata = createPageMetadata("/");

const HOME_TOOL_VISUAL_IDS: readonly VisualAssetId[] = [
  "home-tool-content",
  "home-tool-showcase",
  "home-tool-growth",
  "home-tool-team",
];

const TOOL_GROUPS = [
  { title: "内容工具", summary: "每天更新，打开就能发" },
  { title: "展示工具", summary: "专业介绍，分享更可靠" },
  { title: "效率工具", summary: "高效雷达，被动引流" },
  { title: "团队工具", summary: "一次更新，全团同步" },
] as const;


const COMMUNITY_STEPS = [
  {
    title: "查找",
    problemTitle: "每天不知道说什么？",
    problem: "四处找发圈/发群的素材\n花很多时间去编辑和排版",
    action: "打开 K-Link 小程序\n快速挑选适合\n自己场景的内容",
    result: "生活日常、健康知识\n热点与趋势、商机与经营洞察等丰富内容供你挑选",
  },
  {
    title: "转发",
    problemTitle: "不敢发广告？",
    problem: "社群里不能发硬广告\n担心被踢、被屏蔽",
    action: "一键即可分享\n内容底部自动链接\n你的专属联系方式",
    result: "体面出现在各类社群\n并持续建立专业人设\n",
  },
  {
    title: "信任",
    problemTitle: "陌生人不信任你？",
    problem: "绞尽脑汁也找不到开口的方法",
    action: "陌生人点开链接\n持续曝光\n完成第一轮信任建立",
    result: "持续输出价值\n而非硬推销\n大家会从看见你到相信你",
  },
  {
    title: "实时",
    problemTitle: "谁是真正意向客户？",
    problem: "客户看没看全靠猜\n一不小心就错过最佳跟进时机",
    action: "会员专属数据反馈\n实时查看谁点击了你的链接\n了解谁对你感兴趣",
    result: "访客轨迹可视化\n优先识别意向客户\n把握最佳跟进时机",
  },
  {
    title: "复制",
    problemTitle: "团队难扩张？",
    problem: "培训很多次，带了很多新人\n真正能拿到结果的人却很少",
    action: "团队长统一配置品牌小程序\n所有成员均可直接使用\n拥有独立名片和锁客功能",
    result: "新人快速上手\n团队统一专业输出\n客户资源持续沉淀",
  },
] as const;

const COMMUNITY_STEP_ICONS = [Search, Send, ShieldCheck, Target, UsersRound] as const;

const PRODUCT_VALUES = [
  { title: "持续曝光", lines: ["1分钟轻松分享", "唤醒社群沉睡的人脉"] },
  { title: "精准获客", lines: ["从链接到转化，我们持续进化"] },
  { title: "团队复制", lines: ["共享品牌与团队IP 极速复制 全员可用"] },
  { title: "私域增长", lines: ["用转发链接", "锚定私域增长用户"] },
] as const;

const PRODUCT_VALUE_ICONS = [Eye, Target, UsersRound, Network] as const;

const MEDIA_VALUES = [
  { title: "专业撰稿", lines: ["专业新闻稿撰写", "量身定制新闻稿", "合规发布"] },
  { title: "权威背书", lines: ["官方媒体", "实时收录", "数据反馈"] },
  { title: "舆情管理", lines: ["风险回应", "争议处理", "重塑信任"] },
  { title: "团队凝聚", lines: ["打造团队IP", "持续曝光", "沉淀口碑"] },
] as const;

const MEDIA_VALUE_ICONS = [FileText, ShieldCheck, Radar, Megaphone] as const;

export default function HomePage() {
  return (
    <>
      <StaticPageStructuredData route="/" />
      <PageHero
        variant="product"
        eyebrow=""
        title="一站式拓客与团队数智化工具系统"
        lead={<>每天有现成内容，转发就带上你<br />1分钟挑一条，让群里的陌生人记住你、找到你</>}
        actions={<MiniProgramTrialButton className="home-vector-icon-cta" label="体验K-Link小程序" source="home:hero" />}
        visual={<VisualAssetSlot asset={getVisualAsset("home-hero")} dimensionLabel="Hero Banner" priority sizes="100vw" />}
        aside={
          <div className="home-hero-question">
            <h2>熟人名单总会用完，陌生人才是下一站</h2>
            <p>你手机里均 80-150 个微信群 · 常打开的不到 20 个</p>
            <p>把人均约2万的微信群友，变成你的私域客户池</p>
            <strong>「客来宝---让更多潜在客户主动加你」</strong>
          </div>
        }
      />

      <Section
        tone="white"
        title="全套工具"
        description="内容、名片、雷达、团队协同——一个人能用，一个团队也能用"
      >
        <div className="home-tool-groups home-tool-groups--four">
          {TOOL_GROUPS.map((group, index) => (
            <article key={group.title}>
              <header>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{group.title}</h3>
              </header>
              <VisualAssetSlot asset={getVisualAsset(HOME_TOOL_VISUAL_IDS[index])} sizes="(max-width: 768px) 100vw, 25vw" />
              <p>{group.summary}</p>
              <Link className="context-link" href="/features">查看{group.title}</Link>
            </article>
          ))}
        </div>
      </Section>

      <Section
        className="home-story-section"
        id="light-social-system"
        title="专为营销人，打造的轻社交经营系统"
        description="从被人看见，到被人信任，再到被人主动找到"
      >
        <ol className="home-story">
          {COMMUNITY_STEPS.map((step, index) => (
            <li key={step.title}>
              <div className="home-story__problem">
                <strong>{step.problemTitle}</strong>
                <p>{step.problem}</p>
              </div>
              <header className="home-story__flow">
                <span className="home-story__icon" aria-hidden="true">
                  {(() => { const Icon = COMMUNITY_STEP_ICONS[index]; return <Icon />; })()}
                </span>
                <h3>{step.title}</h3>
                {index < COMMUNITY_STEPS.length - 1 ? <ArrowRight className="home-story__arrow" aria-hidden="true" /> : null}
              </header>
              <div className="home-story__solution">
                <div className="home-story__action">
                  <p>{step.action}</p>
                </div>
                <div className="home-story__result">
                  <p>{step.result}</p>
                </div>
              </div>
            </li>
          ))}
        </ol>
        <ol className="home-process" aria-label="轻社交经营五步链路">
          {["价值内容", "社交传播", "建立信任", "识别意向", "团队复制"].map((step, index) => (
            <li key={step}>
              <h3>{step}</h3>
              {index < 4 ? <ArrowRight aria-hidden="true" /> : null}
            </li>
          ))}
        </ol>
      </Section>

      <Section
        tone="white"
        title="重构你的展业效率"
        description="把每天至少1小时的重复工作，变成1分钟"
      >
        <div className="home-value-grid home-value-grid--media-layout" role="list">
          {PRODUCT_VALUES.map((value, index) => (
            <article key={value.title} role="listitem">
              {(() => {
                const Icon = PRODUCT_VALUE_ICONS[index];
                return <Icon aria-hidden="true" className="home-value-grid__icon" />;
              })()}
              <h3>{value.title}</h3>
              {value.lines.map((line) => <p key={line}>{line}</p>)}
            </article>
          ))}
        </div>
      </Section>

      <Section
        title="媒体服务，一篇能用很久"
        description="发朋友圈 · 发群里 · 给团队看 · 给意向用户看（个人专访 · 团队报道 · 活动发布 · 全国品宣）"
      >
        <div className="home-media-grid">
          {MEDIA_VALUES.map((value, index) => (
            <article key={value.title}>
              {(() => { const Icon = MEDIA_VALUE_ICONS[index]; return <Icon aria-hidden="true" />; })()}
              <h3>{value.title}</h3>
              {value.lines.map((line) => <p key={line}>{line}</p>)}
            </article>
          ))}
        </div>
        <Link className="context-link" href="/media">查看媒体发稿</Link>
      </Section>

      <ContentTeasers contentType="news" />
      <ContentTeasers contentType="case" />

      <Section tone="navy" className="home-final-cta">
        <div className="home-final-cta__layout">
          <div className="home-final-cta__content">
            <div>
              <h2>开启你的社群获客助手</h2>
              <p>从熟人介绍，到信任经营</p>
              <p>客来宝帮你激活微信社群，建立个人影响力，持续获得自然连接</p>
              <p>让每一次分享，都成为一次有效连接</p>
              <p className="home-final-cta__assurance">0 隐私采集　|　0 业务干预　|　私域资产完全归你</p>
            </div>
            <MiniProgramTrialButton className="home-vector-icon-cta" label="立即申请免费体验会员" source="home:final" />
          </div>
          <QrCodeCard
            alt="K-Link 小程序免费体验二维码"
            description="使用微信扫码；移动端可长按识别或保存后在微信中打开。"
            src={MINI_PROGRAM_TRIAL.qrImagePath}
            title="K-Link 小程序"
          />
        </div>
      </Section>
    </>
  );
}
