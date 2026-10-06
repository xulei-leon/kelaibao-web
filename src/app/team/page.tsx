import { MiniProgramTrialButton } from "@/components/mini-program-trial";
import { PageHero } from "@/components/ui/page-hero";
import { Section } from "@/components/ui/section";
import { VisualAssetSlot } from "@/components/visual-asset-slot";
import { getVisualAsset } from "@/content/visual-assets";
import { createPageMetadata } from "@/lib/route-metadata";
import { StaticPageStructuredData } from "@/components/static-page-structured-data";
import { ClipboardList, Copy, Megaphone, UserMinus } from "lucide-react";

export const metadata = createPageMetadata("/team");

const CHALLENGES = [
  {
    title: "经验复制难",
    description: "团队长丰富的沟通技巧与实战经验难以标准化，新人带教依赖口传心授，耗时耗力且成功率不可控。",
  },
  {
    title: "品牌宣发乱",
    description: "队员展业素材缺乏统一规范，低质或硬广式宣发容易拉低团队形象，甚至引发目标客户的防备与排斥。",
  },
  {
    title: "团队留存低",
    description: "新人因缺乏有效的拓客抓手而长期难拿结果，信心受挫导致流失率居高不下，团队陷入反复招聘与带教的消耗循环。",
  },
  {
    title: "团队管理差",
    description: "无法实时掌握队员的展业动态与客户跟进深度，指导缺乏数据支撑，难以提供精准协助。",
  },
] as const;

const CHALLENGE_ICONS = [Copy, Megaphone, UserMinus, ClipboardList] as const;

const CAPABILITIES = [
  {
    title: "形象塑造，重塑团队IP价值",
    description: "依托【品牌专刊】作为自己的内容宣发中心，将团队的品牌文化、产品介绍与新闻动态进行统一呈现，让每一位队员都能代表团队的最高水准面向市场，大幅提升意向合伙人与大客户的信任度。",
  },
  {
    title: "定制化小程序，新人极速启动",
    description: "专业设计团队，可为团队长量身定制团队小程序，新人入会即可一键调用专业素材，零门槛开启高效拓客。",
  },
  {
    title: "无痕链接，激活沉寂的人脉",
    description: "系统页面内置个人微名片，队员一键分享后，页面均会自动关联其个人数字名片与联系方式。既保障了团队品牌的统一声量，又确保了线索无缝归属于队员个人，极大激发全员展业积极性。",
  },
  {
    title: "追踪访客轨迹，精准找到客户",
    description: "基于访客追踪算法，客户浏览轨迹清晰可见，谁点开了转发链接，谁收藏了名片，可基于数据跟进客户，提高关键商机的转化率。",
  },
] as const;

const DELIVERY = [
  {
    title: "需求诊断与系统搭建",
    description: "根据您的团队定位与品牌诉求，个性化配置团队小程序与品牌专刊视觉风格。",
  },
  {
    title: "内容全面策划设计",
    description: "协助归纳并导入团队现有的优质话术、宣传画册、培训资料与海报模板。",
  },
  {
    title: "团队启动",
    description: "提供配套的标准化上手指南与辅导，支持系统快速落地。",
  },
] as const;

export default function TeamPage() {
  return (
    <>
      <StaticPageStructuredData route="/team" />
      <PageHero
        compact
        variant="solution"
        eyebrow="——专为带团队的人打造"
        title="为团队提供省时间、提效率、高复制的专属团队小程序"
        lead={<>你的一次搭建，全团共用，谁用就是谁的联系方式<br />激活老队员，带动新人，团队步调一致，拓客倍增</>}
        actions={<MiniProgramTrialButton label="免费体验k-link" source="team" />}
        visual={<VisualAssetSlot asset={getVisualAsset("team-hero")} dimensionLabel="Hero Banner" priority sizes="100vw" />}
      />

      <Section
        tone="white"
        title="从“个人精英”到“系统赋能”"
        description="为您解决团队规模增长背后的管理与复制难题"
      >
        <div className="team-challenge-grid team-challenge-grid--matrix">
          {CHALLENGES.map((challenge, index) => (
            <article key={challenge.title}>
              {(() => {
                const Icon = CHALLENGE_ICONS[index];
                return <Icon className="team-challenge-grid__icon" aria-hidden="true" />;
              })()}
              <h3>{challenge.title}</h3>
              <p>{challenge.description}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section
        title="K-Link赋能体系"
        description="从个人能力到系统化数字资产的跃迁"
      >
        <p className="team-system-lead">为团队长量身打造的数智化管理与赋能系统，让复制更简单，带队更轻松，轻松实现团队裂变增长。</p>
        <div className="team-capability-grid team-capability-grid--detailed">
          {CAPABILITIES.map((capability, index) => (
            <article key={capability.title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{capability.title}</h3>
              <p>{capability.description}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section tone="white">
        <blockquote className="team-leadership-quote">一个人厉害是能力<br />让一万个人都会，才是领导力</blockquote>
        <p className="team-leadership-support">一键拥有一套可复制的团队能力，每天节省 1 小时，一年多出 2 个月，实现团队带教与业绩的倍增。</p>
        <div className="team-mechanism-list">
          <article className="anchor-target" id="team-mini-program">
            <span>01</span>
            <div>
              <h3>搭建可复制的团队小程序</h3>
              <br />
              <strong>一次搭建，全员共享</strong>
              <p>团队长打造高品质团队 IP，整合产品介绍、成功案例、话术模板，无需反复发送迭代资料，一键更新，全员即可实时同步使用最新的内容。</p>
              <strong>极速标准化复制</strong>
              <p>队员只需一键转发，就能瞬间获得团队长的专业表达力，大幅降低沟通成本，提升成交率。</p>
            </div>
          </article>
          <article className="anchor-target" id="member-attribution">
            <span>02</span>
            <div>
              <h3>谁分享，客户就是谁的</h3>
              <br />
              <strong>底层私域锁客技术</strong>
              <p>彻底消除队员的利益顾虑。不抢流量、不越级留存，真正激活全员裂变。</p>
              <strong>公平、透明、隔离</strong>
              <p>全员使用同一篇品牌专刊或海报，只要是 A 分享出去的，页面就只会显示 A 的二维码与数字名片，访客线索也只保留在 A 的后台。</p>
            </div>
          </article>
        </div>
      </Section>

      <Section
        tone="champagne-mist"
        title="交付与服务保障"
        description="为了确保系统与团队业务场景的深度融合，我们提供一站式数智化交付服务："
      >
        <ol className="delivery-guarantee-grid">
          {DELIVERY.map((item, index) => (
            <li key={item.title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </li>
          ))}
        </ol>
      </Section>

    </>
  );
}
