import Link from "next/link";
import { MiniProgramTrialButton } from "@/components/mini-program-trial";
import { OperationsHero } from "@/components/operations-hero";
import { StaticPageStructuredData } from "@/components/static-page-structured-data";
import { createPageMetadata } from "@/lib/route-metadata";

export const metadata = createPageMetadata("/");

export default function HomePage() {
  return (
    <div className="ops-page ops-home">
      <StaticPageStructuredData route="/" />
      <OperationsHero image="home">
        <div className="shell hero-inner">
          <div className="tag">
            {"一站式拓客与团队效率工具系统"}
          </div>
          <h1>
            {"你手机里躺着几百个微信群、几万个陌生群友——真正认识你的，有几个？"}
          </h1>
          <p>
            {"客来宝每天给你现成的好内容，转发就带上你。1分钟挑一条，让群里的陌生人记住你、找到你。"}
          </p>
          <div className="hero-actions">
            <MiniProgramTrialButton className="btn" label="免费体验K-Link →" source="index" />
          </div>
        </div>
      </OperationsHero>
      <section className="content-showcase" aria-labelledby="content-showcase-title">
        <div className="shell content-showcase__inner">
          <div>
            <h2 id="content-showcase-title">今日内容橱窗</h2>
            <p>每天真实更新的一篇早报+一条有趣话题+一张每日一图+多个发群发圈可用的好内容，可直接使用。</p>
            <ul className="content-showcase__types">
              <li>早报</li>
              <li>有趣话题</li>
              <li>每日一图</li>
              <li>发群发圈好内容</li>
            </ul>
          </div>
          <MiniProgramTrialButton className="btn" label="打开小程序查看" source="index" />
        </div>
      </section>
      <section className="area" id="pain">
        <div className="shell">
          <div className="area-kicker">
            {"先看清现实"}
          </div>
          <h2>
            {"熟人名单总会用完，陌生人才是下一站"}
          </h2>
          <p className="intro">
            {"你手机里有上百到数百个微信群。按一个群平均100人算，200个群就是约2万个陌生群友——可99%的群都是别人的：发广告被踢，不发，没人认识。加群容易，加好友难。"}
          </p>
          <div className="cards">
            <article className="card">
              <h3>
                {"群很多，认识你的人很少"}
              </h3>
              <p>
                {"每天潜水，群友认识群主却不认识你。想开口又没话题，想发产品又怕被踢。"}
              </p>
            </article>
            <article className="card">
              <h3>
                {"朋友圈没内容可发"}
              </h3>
              <p>
                {"每天找文章、挑图、改文案，一小时就没了。有这时间，不如去跟客户聊两句。"}
              </p>
            </article>
            <article className="card">
              <h3>
                {"团队越大越难带"}
              </h3>
              <p>
                {"有人不会开口，有人等你投喂素材，有人发的还不一样。团队长的时间全花在重复通知上。"}
              </p>
            </article>
          </div>
        </div>
      </section>
      <section className="area alt" id="how">
        <div className="shell">
          <div className="area-kicker">
            {"它是怎么起作用的"}
          </div>
          <h2>
            {"不用加好友，先让人记住你"}
          </h2>
          <p className="intro">
            {"客来宝不替你群发消息、不帮你批量加好友。它只做一件事：给你值得分享的好内容，让\"被记住\"自然发生。"}
          </p>
          <div className="step-list">
            <div className="step">
              <b>
                {"01"}
              </b>
              <h3>
                {"挑一条"}
              </h3>
              <p>
                {"每天都有数百个现成内容可选，1分钟挑一条适合这个群的。"}
              </p>
            </div>
            <div className="step">
              <b>
                {"02"}
              </b>
              <h3>
                {"转出去"}
              </h3>
              <p>
                {"发到微信群或朋友圈，纯内容分享，无广告、无营销感。"}
              </p>
            </div>
            <div className="step">
              <b>
                {"03"}
              </b>
              <h3>
                {"被记住"}
              </h3>
              <p>
                {"文章底部安静地带上你的二维码和\"分享这一刻\"——不打扰，但看得见。"}
              </p>
            </div>
            <div className="step">
              <b>
                {"04"}
              </b>
              <h3>
                {"被找到"}
              </h3>
              <p>
                {"感兴趣的群友主动加你。加了好友之后怎么聊、怎么合作，全凭你自己。"}
              </p>
            </div>
          </div>
          <img className="infographic" src="/visual/operations/flow-01.webp" loading="lazy" alt="从陌生社群到自愿联系流程图" width="1600" height="570" decoding="async" />
          <p className="intro" style={{"marginTop": "26px"}}>
            {"去加入一个微信群是容易的，直接去加一个人的微信是难的。客来宝走的，就是那条容易的路。"}
          </p>
        </div>
      </section>
      <section className="area" id="numbers">
        <div className="shell">
          <div className="area-kicker">
            {"已经有不少人在用"}
          </div>
          <h2>
            {"通过微信拓客的人，她们先开始了"}
          </h2>
          <div className="cards">
            <article className="card">
              <h3>
                {"100+"}
              </h3>
              <p>
                {"服务团队"}
                <br />
                {"覆盖多行业私域团队长"}
              </p>
            </article>
            <article className="card">
              <h3>
                {"10000+"}
              </h3>
              <p>
                {"赋能一线人员"}
                <br />
                {"帮助网商伙伴更轻松拓客"}
              </p>
            </article>
            <article className="card">
              <h3>
                {"100万+"}
              </h3>
              <p>
                {"内容传播触达"}
                <br />
                {"持续放大团队品牌与个人影响力"}
              </p>
            </article>
          </div>
        </div>
      </section>
      <section className="area alt" id="who">
        <div className="shell">
          <div className="area-kicker">
            {"对号入座"}
          </div>
          <h2>
            {"你是哪一种？走这条路最快"}
          </h2>
          <div className="cards">
            <article className="card">
              <h3>
                {"个人拓客"}
              </h3>
              <p>
                {"每天发内容没时间、群里没人认识你。"}
              </p>
              <p style={{"marginTop": "12px"}}>
                <Link className="btn" href="/trial">
                  {"免费试用 →"}
                </Link>
              </p>
            </article>
            <article className="card">
              <h3>
                {"团队长"}
              </h3>
              <p>
                {"队员不会讲、内容不统一、新人没素材。"}
              </p>
              <p style={{"marginTop": "12px"}}>
                <Link className="btn" href="/team">
                  {"了解团队效率 →"}
                </Link>
              </p>
            </article>
            <article className="card">
              <h3>
                {"想做个人品牌"}
              </h3>
              <p>
                {"网上一搜没你名字、队员介绍你只能发合影。"}
              </p>
              <p style={{"marginTop": "12px"}}>
                <Link className="btn" href="/media">
                  {"了解媒体服务 →"}
                </Link>
              </p>
            </article>
          </div>
        </div>
      </section>
      <section className="area" id="member-pick">
        <div className="shell">
          <div className="area-kicker">
            {"365天不用您找内容再编辑"}
          </div>
          <h2>
            {"每天省下1小时，一年能多出2个月的工作日，你还拥有："}
          </h2>
          <div className="cards two">
            <article className="card">
              <h3>
                {"每天都有数百个现成内容可选"}
              </h3>
              <p>
                {"不用再满世界找素材。"}
              </p>
            </article>
            <article className="card">
              <h3>
                {"转发自动带上你"}
              </h3>
              <p>
                {"每篇可转发内容底部都有你的二维码。"}
              </p>
            </article>
            <article className="card">
              <h3>
                {"数字名片"}
              </h3>
              <p>
                {"一页讲清你是谁、擅长什么，不用每次重发长文字。"}
              </p>
            </article>
            <article className="card">
              <h3>
                {"被动获客入口"}
              </h3>
              <p>
                {"建自己的主题社群，让感兴趣的人自己找上门。"}
              </p>
            </article>
            <article className="card">
              <h3>
                {"访客轨迹"}
              </h3>
              <p>
                {"知道谁看过你的分享，谁收藏了你，先一步意向察觉。"}
              </p>
            </article>
            <article className="card">
              <h3>
                {"行业专刊"}
              </h3>
              <p>
                {"把你公司的公开资料变成可转发内容，还带你的码。"}
              </p>
            </article>
            <article className="card">
              <h3>
                {"团队小程序"}
              </h3>
              <p>
                {"开通免微信认证费，队员一键复制专业形象。"}
              </p>
            </article>
            <article className="card">
              <h3>
                {"媒体全程服务与补贴"}
              </h3>
              <p>
                {"人物专访、团队报道，会员专享补贴。"}
              </p>
            </article>
            <article className="card">
              <h3>
                {"免费升级"}
              </h3>
              <p>
                {"新工具新功能，会员直接用。"}
              </p>
            </article>
          </div>
          <div className="hero-actions">
            <MiniProgramTrialButton className="btn" label="免费试用 →" source="index" />
            <Link className="btn btn-secondary" href="/about#contact">咨询企业微信</Link>
          </div>
        </div>
      </section>
      <section className="area alt" id="closer">
        <div className="shell">
          <div className="area-kicker">
            {"现在就开始"}
          </div>
          <h2>
            {"不用先弄懂所有功能，先分享一篇有价值的内容。"}
          </h2>
          <div className="inline-action">
            <MiniProgramTrialButton className="btn" label="立即免费体验 →" source="index" />
          </div>
        </div>
      </section>
    </div>
  );
}
