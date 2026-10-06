import { MiniProgramTrialButton } from "@/components/mini-program-trial";
import { QrCodeCard } from "@/components/qr-code-card";
import { StaticPageStructuredData } from "@/components/static-page-structured-data";
import { PageHero } from "@/components/ui/page-hero";
import { PhraseFlow } from "@/components/ui/phrase-flow";
import { Section } from "@/components/ui/section";
import { VisualAssetSlot } from "@/components/visual-asset-slot";
import { getVisualAsset } from "@/content/visual-assets";
import { createPageMetadata } from "@/lib/route-metadata";
import { MINI_PROGRAM_TRIAL } from "@/lib/site-config";

export const metadata = createPageMetadata("/features");

const JOURNEY = ["曝光", "获客", "信任", "成交", "沉淀"] as const;

const MEMBER_BENEFITS = [
  ["每天能发各类内容", "13 条+"],
  ["转发带上你的联系方式", "所有可转发内容"],
  ["数字名片", "完整展示自己"],
  ["被动获客", "建立自己社群入口"],
  ["我的私域", "知道是谁看过我"],
  ["行业专刊", "多行业内容，可添加"],
  ["团队小程序", "开通免微信实名认证费300元"],
  ["媒体发稿套餐", "会员专享补贴，高达50%"],
  ["免费升级", "新工具，新功能，免费使用"],
] as const;

export default function FeaturesPage() {
  return (
    <>
      <StaticPageStructuredData route="/features" />
      <PageHero
        compact
        variant="product"
        eyebrow=""
        title="从被看见，到被找到"
        lead="围绕「每天发什么、发给谁、谁在看、怎么带团队」来设计"
        actions={<MiniProgramTrialButton label="免费体验 K-Link" source="features" />}
        visual={<VisualAssetSlot asset={getVisualAsset("features-hero")} dimensionLabel="Hero Banner" priority sizes="100vw" />}
      />

      <Section compact tone="white">
        <ol className="product-journey" aria-label="K-Link 五阶段路径">
          {JOURNEY.map((stage, index) => (
            <li key={stage}><span>{String(index + 1).padStart(2, "0")}</span><strong>{stage}</strong></li>
          ))}
        </ol>
      </Section>

      <Section title="扫码可见所有工具，可体验" description="打开 K-Link 小程序，查看当前可用工具和会员能力。">
        <div className="features-trial-card">
          <QrCodeCard
            alt="K-Link 小程序工具体验二维码"
            description="使用微信扫码；移动端可长按识别或保存后在微信中打开。"
            src={MINI_PROGRAM_TRIAL.qrImagePath}
            title="K-Link 小程序"
          />
        </div>
      </Section>

      <Section tone="white" title="客来宝(K-Link Future)会员能获得什么">
        <div className="membership-benefits-table-wrap">
          <table className="membership-benefits-table">
            <thead><tr><th scope="col">会员权益</th><th scope="col">权益说明</th></tr></thead>
            <tbody>
              {MEMBER_BENEFITS.map(([benefit, detail]) => (
                <tr key={benefit}><th scope="row">{benefit}</th><td>{detail}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section tone="navy">
        <div className="narrow-dark-cta product-page-cta">
          <h2 className="product-page-cta__outcomes"><PhraseFlow phrases={["内容", "展示", "高效", "团队"]} separator="·" /></h2>
          <p>客来宝不是把功能堆在一起，而是把内容、连接、信任、记录串成一条能跑通的线。</p>
        </div>
      </Section>
    </>
  );
}
