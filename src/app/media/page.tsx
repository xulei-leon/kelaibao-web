import { CircleAlert, FileQuestion, SearchX, UsersRound } from "lucide-react";
import Link from "next/link";

import { QrCodeCard } from "@/components/qr-code-card";
import { PageHero } from "@/components/ui/page-hero";
import { Section } from "@/components/ui/section";
import { WechatContactButton } from "@/components/wechat-contact";
import { VisualAssetSlot } from "@/components/visual-asset-slot";
import { StaticPageStructuredData } from "@/components/static-page-structured-data";
import { getVisualAsset } from "@/content/visual-assets";
import { createPageMetadata } from "@/lib/route-metadata";
import { WECHAT_CONTACT } from "@/lib/site-config";

export const metadata = createPageMetadata("/media");

const MEDIA_PROBLEMS = [
  { text: "私域营销做得再好，陌生客户依然缺乏信任", Icon: UsersRound },
  { text: "搜索与AI工具尚未形成清晰、可核验的公开信息", Icon: SearchX },
  { text: "团队有成果，却缺少对外影响力", Icon: CircleAlert },
  { text: "想做团队IP，但不知道如何公开表达", Icon: FileQuestion },
] as const;

const MEDIA_OUTLETS = {
  "主流门户媒体": ["今日头条", "新浪网", "腾讯网", "搜狐网", "网易网", "凤凰网", "..."],
  "地方权威官媒": ["长沙晚报", "郑州广播电视报", "江西快报", "江苏青年网", "济南日报", "..."],
} as const;

const MEDIA_REASONS = [
  "不是广告，是第三方说你：媒体上的你，比自己说更有分量",
  "一篇顶很久：发在媒体上的内容，搜得到、转得动、用半年",
  "会员更省：客来宝会员发稿，享标准价 50% 补贴（限时）",
] as const;

const TEAM_CONTENT = [
  { title: "1.领导者持续发声", items: ["行业观点", "健康科普", "经营思考", "团队理念"] },
  { title: "2.成员成果被看见", items: ["新人成长", "服务案例", "客户故事", "团队荣誉"] },
  { title: "3.团队故事被传播", items: ["团队活动", "学习氛围", "互助文化", "共同目标"] },
] as const;

const PUBLICATION_STEPS = ["选题", "撰稿", "审核", "发布", "追踪", "反馈"] as const;

export default function MediaPage() {
  return (
    <>
      <StaticPageStructuredData route="/media" />
      <div className="legacy-anchors" aria-hidden="true">
        <span id="direct-sales" /><span id="insurance" /><span id="securities" />
      </div>

      <PageHero
        compact
        variant="editorial-dark"
        eyebrow=""
        title="发一篇，能用很久"
        lead="个人专访 · 团队报道 · 活动发布 · 全国品宣——一次发稿，朋友圈、群、团队、新人都能用"
        actions={<WechatContactButton label="咨询媒体报道" source="media" />}
        visual={<VisualAssetSlot asset={getVisualAsset("media-hero")} dimensionLabel="Hero Banner" priority sizes="100vw" />}
        boundary="媒体范围、审核与发布结果按实际项目逐项确认。"
      />

      <Section tone="white" title="你为什么需要媒体背书？">
        <div className="media-problem-grid" role="list">
          {MEDIA_PROBLEMS.map(({ text, Icon }) => (
            <article key={text} role="listitem">
              <Icon aria-hidden="true" className="media-problem-icon" />
              <p>{text}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section title="为什么带团队的人需要媒体发稿">
        <div className="media-impact-grid media-impact-grid--three">
          {MEDIA_REASONS.map((reason, index) => (
            <article key={reason}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <p>{reason}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section title="让个人和团队一起被看见">
        <div className="media-content-pillars">
          {TEAM_CONTENT.map((pillar) => (
            <article key={pillar.title}>
              <h3>{pillar.title}</h3>
              <ul>{pillar.items.map((item) => <li key={item}>{item}</li>)}</ul>
            </article>
          ))}
        </div>
      </Section>

      <Section
        id="services"
        tone="white"
        title="一站式发稿服务"
        description="具体媒体清单、审核条件与反馈数据由实际项目和平台决定"
      >
        <ol className="media-publication-flow" id="method">
          {PUBLICATION_STEPS.map((step, index) => (
            <li key={step}><span>{String(index + 1).padStart(2, "0")}</span><strong>{step}</strong></li>
          ))}
        </ol>
      </Section>

      <Section
        id="outlets"
        tone="white"
        title="百家主流媒体全覆盖"
        description="更多价值报道，更多媒体的定制，请联系我们"
        >
        <div className="media-outlet-groups">
          {Object.entries(MEDIA_OUTLETS).map(([category, outlets]) => (
            <p key={category} className="media-outlet-groups__row">
              <strong>{category}：</strong>{outlets.join(" / ")}
            </p>
          ))}

        </div>
      </Section>

      <Section title="四套会员专享套餐" description="客来宝 K-Link 媒体套餐覆盖个人 IP、团队招商、品牌项目和线下活动。">
        <Link className="context-link" href="/media/packages">查看客来宝 K-Link 媒体套餐</Link>
      </Section>

      <Section tone="navy" className="media-final-cta">
        <div className="media-final-cta__layout">
          <div className="narrow-dark-cta">
            <h2>开启你的媒体背书之路</h2>
            <WechatContactButton label="咨询媒体报道" source="media-final" />
          </div>
          <QrCodeCard
            alt="客来宝媒体企业微信咨询二维码"
            description="使用微信扫码咨询；移动端可长按识别或保存后在微信中打开。"
            src={WECHAT_CONTACT.qrImagePath}
            title="企业微信"
          />
        </div>
      </Section>
    </>
  );
}
