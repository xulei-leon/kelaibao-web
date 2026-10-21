import Link from "next/link";
import { MiniProgramTrialButton } from "@/components/mini-program-trial";
import { OperationsHero } from "@/components/operations-hero";
import { StaticPageStructuredData } from "@/components/static-page-structured-data";
import { createPageMetadata } from "@/lib/route-metadata";

export const metadata = createPageMetadata("/team");

export default function TeamPage() {
  return (
    <div className="ops-page">
      <StaticPageStructuredData route="/team" />
      <OperationsHero image="team">
        <div className="shell hero-inner">
          <div className="tag">
            {"TEAM · 团队小程序"}
          </div>
          <h1>
            {"一个人会卖货，不代表整个团队都会。"}
          </h1>
          <p>
            {"团队长整理一次，队员人人有素材、个个有形象。新人当天就能像样的开始转发拓客。"}
          </p>
          <div className="hero-actions">
            <Link className="btn" href="/about#contact">咨询团队方案 →</Link>
            <Link className="btn btn-secondary" href="/media">
              {"先看看媒体服务"}
            </Link>
          </div>
        </div>
      </OperationsHero>
      <section className="area" id="pains">
        <div className="shell">
          <div className="area-kicker">
            {"团队长的深夜emo"}
          </div>
          <h2>
            {"你的团队，是不是也这样？"}
          </h2>
          <div className="cards">
            <article className="card">
              <h3>
                {"经验复制难"}
              </h3>
              <p>
                {"你讲得头头是道，队员转述就走样。能力长在你身上，复制不过去。"}
              </p>
            </article>
            <article className="card">
              <h3>
                {"品牌宣发乱"}
              </h3>
              <p>
                {"每个人发的介绍都不一样，客户问三个人，听到三个版本。"}
              </p>
            </article>
            <article className="card">
              <h3>
                {"新人启动慢"}
              </h3>
              <p>
                {"新人没内容、没话术、没形象，前三个月基本在瞎忙。"}
              </p>
            </article>
            <article className="card">
              <h3>
                {"管理靠吼"}
              </h3>
              <p>
                {"素材更新了，一个个私聊通知；有人没发，你还不知道。"}
              </p>
            </article>
            <article className="card">
              <h3>
                {"激活老队员"}
              </h3>
              <p>
                {"老队员的熟人摸了几遍了，新工具新方法，陌生拓客有望，再次充满活力。"}
              </p>
            </article>
          </div>
        </div>
      </section>
      <section className="area alt" id="solution">
        <div className="shell">
          <div className="area-kicker">
            {"怎么解决"}
          </div>
          <h2>
            {"整理一次，全员复制"}
          </h2>
          <div className="step-list">
            <div className="step">
              <b>
                {"01"}
              </b>
              <h3>
                {"统一梳理"}
              </h3>
              <p>
                {"把团队介绍、常用资料、好内容，一次性整理进小程序。"}
              </p>
            </div>
            <div className="step">
              <b>
                {"02"}
              </b>
              <h3>
                {"成员进入"}
              </h3>
              <p>
                {"队员直接进入，看到的全是整理好的、能直接用的。"}
              </p>
            </div>
            <div className="step">
              <b>
                {"03"}
              </b>
              <h3>
                {"一键使用"}
              </h3>
              <p>
                {"选内容、发出去——每一篇都自动带上队员自己的二维码和名片。"}
              </p>
            </div>
            <div className="step">
              <b>
                {"04"}
              </b>
              <h3>
                {"各自沉淀"}
              </h3>
              <p>
                {"谁分享，客户就是谁的。访客线索只进分享者自己的后台，互不干扰。"}
              </p>
            </div>
          </div>
          <img className="infographic" src="/visual/operations/flow-03.webp" loading="lazy" alt="团队内容复制流程图" width="1600" height="570" decoding="async" />
          <p className="intro" style={{"marginTop": "26px", "fontWeight": 700}}>
            {"统一的是内容，独立的是每个人的客户。"}
          </p>
        </div>
      </section>
      <section className="area" id="voices">
        <div className="shell">
          <div className="area-kicker">
            {"他们已经在用"}
          </div>
          <h2>
            {"先看别人怎么说"}
          </h2>
          <div className="cards two">
            <article className="card">
              <h3>
                {"顾梅 · 团队长"}
              </h3>
              <p>
                {"\"以前每天起床第一件事就是找今天发什么，现在1分钟搞定。队员拿到的都是一样的东西，我终于不用一个个去纠正了，省下来的时间能专心带新人。\""}
              </p>
            </article>
            <article className="card">
              <h3>
                {"丽伟 · 团队长"}
              </h3>
              <p>
                {"\"最打动我的是老队员被激活了。新工具新方法拿出来，好几个沉寂的老队员又开始动了。统一的是内容，但每个人的客户还是自己的，这点大家都很认可。\""}
              </p>
            </article>
          </div>
        </div>
      </section>
      <section className="area alt" id="combo">
        <div className="shell">
          <div className="area-kicker">
            {"组合拳"}
          </div>
          <h2>
            {"工具解决效率，媒体解决面子"}
          </h2>
          <p className="intro">
            {"团队小程序让队员有东西发；人物专访和团队报道，让队员有故事讲。两个一起用，新人留存完全不一样。媒体服务会员专享大金额补贴，可单独咨询。"}
          </p>
          <div className="inline-action">
            <Link className="btn" href="/media">
              {"了解媒体服务 →"}
            </Link>
          </div>
        </div>
      </section>
      <section className="area" id="cta">
        <div className="shell">
          <div className="area-kicker">
            {"现在就开始"}
          </div>
          <h2>
            {"别让你的经验，只长在你一个人身上。"}
          </h2>
          <div className="inline-action">
            <Link className="btn" href="/about#contact">咨询团队方案 →</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
