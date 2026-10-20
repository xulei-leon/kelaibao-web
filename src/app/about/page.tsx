import { ContentTeasers } from "@/components/content-teasers";
import { QrCodeCard } from "@/components/qr-code-card";
import { ImageLightbox } from "@/components/image-lightbox";
import { ActionLink } from "@/components/ui/action-link";
import { PageHero } from "@/components/ui/page-hero";
import { VisualAssetSlot } from "@/components/visual-asset-slot";
import { Section } from "@/components/ui/section";
import { getVisualAsset } from "@/content/visual-assets";
import { createPageMetadata } from "@/lib/route-metadata";
import { StaticPageStructuredData } from "@/components/static-page-structured-data";
import { MINI_PROGRAM_TRIAL, WECHAT_CONTACT } from "@/lib/site-config";

export const metadata = createPageMetadata("/about");

const CULTURE = [
  ["品牌愿景", "成为带团队的人长期可信赖的经营伙伴。"],
  ["核心理念", "用工具降低获客门槛，用内容提升专业表达，用数据驱动团队增长。"],
  ["团队使命", "让优秀经验实现规模化复制，让团队增长更加稳定、长久、可持续。"],
] as const;

const METRICS = [
  { value: "100+", label: "服务团队", description: "覆盖多行业私域团队长" },
  { value: "10万+", label: "赋能一线人员", description: "帮助网商伙伴更轻松拓客" },
  { value: "100万+", label: "内容传播触达", description: "持续放大团队品牌与个人影响力" },
] as const;

const SECURITY = [
  { title: "0隐私采集", description: "无需实名认证，不采集通讯录，不获取敏感隐私。用户始终具有主动选择权，从源头杜绝泄露。" },
  { title: "0业务干预", description: "客来宝专注技术服务，不参与团队管理，不触碰组织架构，不干预团队运营，充分保障业务自主权。" },
  { title: "100%私域归属", description: "专属数据加密与独立存储，由底层代码自动执行技术归集，谁分享，数据和客户就归谁。用户线索、私域沉淀绝对保密，只属于用户个人。" },
] as const;

const FOLLOW_CHANNELS = [
  {
    src: MINI_PROGRAM_TRIAL.qrImagePath,
    alt: "K-Link 小程序免费体验二维码",
    title: "小程序",
    description: "使用微信扫码体验 K-Link；移动端可长按识别或保存后打开。",
  },
  {
    src: "/wechat/kelaibao-official-account-qr.png",
    alt: "客来宝微信公众号二维码",
    title: "公众号",
    description: "使用微信扫码关注客来宝公众号。",
  },
  {
    src: "/wechat/kelaibao-video-channel-qr.png",
    alt: "客来宝微信视频号二维码",
    title: "视频号",
    description: "使用微信扫码关注客来宝视频号。",
  },
  {
    src: WECHAT_CONTACT.qrImagePath,
    alt: "客来宝企业微信咨询二维码",
    title: "企业微信",
    description: "使用微信扫码咨询客来宝顾问。",
  },
] as const;

const COMPANY_INTRODUCTION = [
  "客来宝专注私域经营工具的研发，为带团队的经营者、大健康与成长型销售团队提供内容协同与客户经营工具。",
  "由资深互联网软件技术专家与长期深耕微信社群经营场景的顾问联合打造。",
  "客来宝旗下小程序K-Link将内容、数据与团队运营能力深度结合，帮助个人提升专业度与拓客效率，帮助团队建立统一、可复制、可沉淀的运营体系。",
  "从个人拓客到团队运营，从内容传播到客户沉淀，客来宝始终坚持：让每一次连接都能体现专业、建立人设。",
] as const;

export default function AboutPage() {
  return (
    <>
      <StaticPageStructuredData route="/about" />
      <PageHero
        compact
        variant="solution"
        eyebrow=""
        title="关于我们"
        lead="一款好用的微信社群/私域经营工具，让个人获客与团队协同更专业、更高效、更可持续"
        visual={<VisualAssetSlot asset={getVisualAsset("about-hero")} dimensionLabel="Hero Banner" priority sizes="100vw" />}
      />

      <div className="about-page">
      <Section tone="white" title="公司介绍">
        <div className="about-introduction">
          {COMPANY_INTRODUCTION.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </div>

        <div className="about-metrics-grid">
          {METRICS.map((metric) => (
            <article key={metric.value}>
              <strong>{metric.value}</strong>
              <h3>{metric.label}</h3>
              <p>{metric.description}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section tone="white" title="企业文化">
        <div className="about-culture-grid about-culture-grid--three">
          {CULTURE.map(([title, description], index) => (
            <article key={title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section
        tone="champagne-mist"
        title="安全与合规保障"
      >
        <div className="about-security-grid">
          {SECURITY.map((item) => (
            <article key={item.title}><h3>{item.title}</h3><p>{item.description}</p></article>
          ))}
        </div>
      </Section>

      <Section
        tone="champagne-mist"
        title="新闻动态"
      >
        <div className="about-news-entry">
          <p>查看客来宝已经公开发布的新闻内容。</p>
          <ActionLink href="/news">查看新闻动态</ActionLink>
          <ContentTeasers contentType="news" />
          <ContentTeasers contentType="case" />
        </div>
      </Section>

      <Section tone="white" title="公司实景">
        <div className="about-office-grid">
          <article>
            <h3>实景展示</h3>
            <ImageLightbox alt="客来宝办公室场景" height={1456} label="查看办公室场景大图" preview={false} showOriginalLink={false} src="/brand/office-scenes.png" triggerText="点击查看" width={1435} />
          </article>
          <article>
            <h3>到访指引</h3>
            <ImageLightbox alt="客来宝办公室到访指引" height={5584} label="查看到访指引大图" modalClassName="image-lightbox--tall" preview={false} showOriginalLink={false} src="/brand/arrival-guide.webp" triggerText="点击查看" width={1500} />
          </article>
        </div>
      </Section>

      <Section
        id="contact"
        tone="white"
        title="联系我们"
        description="关注我们"
      >
        <div className="about-follow-grid">
          {FOLLOW_CHANNELS.map((channel) => <QrCodeCard key={channel.title} {...channel} />)}
        </div>
      </Section>
      </div>
    </>
  );
}
