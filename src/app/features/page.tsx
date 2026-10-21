import Link from "next/link";
import { MiniProgramTrialButton } from "@/components/mini-program-trial";
import { OperationsHero } from "@/components/operations-hero";
import { StaticPageStructuredData } from "@/components/static-page-structured-data";
import { createPageMetadata } from "@/lib/route-metadata";

export const metadata = createPageMetadata("/features");

export default function FeaturesPage() {
  return (
    <div className="ops-page">
      <StaticPageStructuredData route="/features" />
      <OperationsHero image="membership">
        <div className="shell hero-inner">
          <div className="tag">
            {"MEMBER · 年费会员"}
          </div>
          <h1>
            {"每天有现成内容，转发就带上你。"}
          </h1>
          <p>
            {"把找素材、改文案、做排版的一小时，还给真正重要的事：跟人聊天、跟客户见面。"}
          </p>
          <div className="hero-actions">
            <MiniProgramTrialButton className="btn" label="免费试用先体验 →" source="membership" />
            <Link className="btn btn-secondary" href="/about#contact">咨询企业微信</Link>
          </div>
        </div>
      </OperationsHero>
      <section className="area" id="price">
        <div className="shell">
          <div className="area-kicker">
            {"年费会员"}
          </div>
          <h2>
            {"每天不到两块钱"}
          </h2>
          <p className="intro">
            {"一餐饭钱，换来2个月的工作日时间+一整年的内容供应+高效展示工具。"}
          </p>
          <p className="note" style={{"color": "#506772", "fontSize": "14px"}}>
            {"问问你的团队长——他的资历或许能拿到专属优惠。"}
          </p>
          <div className="inline-action">
            <MiniProgramTrialButton className="btn" label="进入小程序开通 →" source="membership" />
          </div>
          <p className="note">
            {"开通与支付在小程序内完成。"}
          </p>
        </div>
      </section>
      <section className="area alt" id="benefits">
        <div className="shell">
          <div className="area-kicker">
            {"9项权益"}
          </div>
          <h2>
            {"599元，拆开看每一项都值"}
          </h2>
          <div className="cards two">
            <article className="card">
              <h3>
                {"1. 每天数百条现成内容"}
              </h3>
              <p>
                {"12个内容模块，日更、周更、不定期更新。你再也不用凌晨翻公众号找素材。"}
              </p>
            </article>
            <article className="card">
              <h3>
                {"2. 转发自动带上你"}
              </h3>
              <p>
                {"所有可转发内容底部，安静地放上你的二维码和\"分享这一刻\"。无广告感，群主不反感。"}
              </p>
            </article>
            <article className="card">
              <h3>
                {"3. 数字名片"}
              </h3>
              <p>
                {"一页讲清你是谁、做什么、怎么联系。别人问\"你是做啥的\"，发一张名片就够了。"}
              </p>
            </article>
            <article className="card">
              <h3>
                {"4. 被动获客入口"}
              </h3>
              <p>
                {"发布自己的主题社群，让有共同兴趣的人主动找上门，而不是你一个个去加。"}
              </p>
            </article>
            <article className="card">
              <h3>
                {"5. 访客轨迹"}
              </h3>
              <p>
                {"谁看过你的分享、看了几次，后台看得见。感兴趣的人，早一步跟进。"}
              </p>
            </article>
            <article className="card">
              <h3>
                {"6. 行业专刊"}
              </h3>
              <p>
                {"把你公司或品牌的公开资料提交收录，变成可转发的内容——转发出去还带你的码。"}
              </p>
            </article>
            <article className="card">
              <h3>
                {"7. 团队小程序"}
              </h3>
              <p>
                {"开通免微信认证费。适合带团队的人，队员一键复制整套专业形象。"}
              </p>
            </article>
            <article className="card">
              <h3>
                {"8. 媒体服务5折"}
              </h3>
              <p>
                {"人物专访、团队报道，会员专享补贴价349元/次起。"}
              </p>
            </article>
            <article className="card">
              <h3>
                {"9. 免费升级"}
              </h3>
              <p>
                {"新工具、新功能上线，会员直接用，不另收费。"}
              </p>
            </article>
          </div>
        </div>
      </section>
      <section className="area" id="day">
        <div className="shell">
          <div className="area-kicker">
            {"它长什么样"}
          </div>
          <h2>
            {"一个会员的普通一天"}
          </h2>
          <div className="step-list">
            <div className="step">
              <b>
                {"早上"}
              </b>
              <h3>
                {"1分钟挑一条"}
              </h3>
              <p>
                {"选一条早安资讯，发到3个群。有人点赞，有人私聊问\"这个挺有意思\"。"}
              </p>
            </div>
            <div className="step">
              <b>
                {"白天"}
              </b>
              <h3>
                {"跟话题发一篇"}
              </h3>
              <p>
                {"群里有人讨论健康话题，顺手发一篇相关的，会员名片就在文章底部。"}
              </p>
            </div>
            <div className="step">
              <b>
                {"晚上"}
              </b>
              <h3>
                {"看一眼访客轨迹"}
              </h3>
              <p>
                {"今天17个人看过你的分享，其中3个还收藏了你的名片。心里有数了。"}
              </p>
            </div>
            <div className="step">
              <b>
                {"睡前"}
              </b>
              <h3>
                {"朋友圈发一条"}
              </h3>
              <p>
                {"图文都是现成的，配文都不用自己想。"}
              </p>
            </div>
          </div>
        </div>
      </section>
      <section className="area alt" id="honest">
        <div className="shell">
          <div className="area-kicker">
            {"实话实说"}
          </div>
          <h2>
            {"有几句实话先说清楚"}
          </h2>
          <p className="intro">
            {"客来宝是工具，不是印钞机。它帮你省时间、被看见、被找到，但加不加好友、成不成单，取决于你的内容选择和跟进。不承诺获客数量与收益。"}
          </p>
          <p className="note" style={{"color": "#506772", "fontSize": "14px"}}>
            {"备注：分享时请遵守各群群规。"}
          </p>
          <div className="inline-action">
            <MiniProgramTrialButton className="btn" label="免费试用 →" source="membership" />
          </div>
        </div>
      </section>
    </div>
  );
}
