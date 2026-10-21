import Link from "next/link";
import { MiniProgramTrialButton } from "@/components/mini-program-trial";
import { WechatContactButton } from "@/components/wechat-contact";
import { OperationsHero } from "@/components/operations-hero";
import { StaticPageStructuredData } from "@/components/static-page-structured-data";
import { createPageMetadata } from "@/lib/route-metadata";

export const metadata = createPageMetadata("/media");

export default function MediaPage() {
  return (
    <div className="ops-page">
      <StaticPageStructuredData route="/media" />
      <div className="legacy-media-anchors" aria-hidden="true"><span id="direct-sales" /><span id="insurance" /><span id="securities" /><span id="samples" /></div>
      <OperationsHero image="media">
        <div className="shell hero-inner">
          <div className="tag">
            {"MEDIA · 团队长增值服务"}
          </div>
          <h1>
            {"发一篇，能用很久。"}
          </h1>
          <p>
            {"个人专访、团队报道、活动发布——一次发稿，朋友圈、社群、团队、新人，全都能用。"}
          </p>
          <div className="hero-actions">
            <Link className="btn" href="/media/packages">
              {"查看四档套餐 →"}
            </Link>
            <WechatContactButton className="btn btn-secondary" label="咨询适不适合我" source="media" />
          </div>
        </div>
      </OperationsHero>
      <section className="area" id="anchor">
        <div className="shell">
          <div className="area-kicker">
            {"先算笔账"}
          </div>
          <h2>
            {"同样的专访，市场价是我们的6–10倍"}
          </h2>
          <p className="intro">
            {"找市面渠道发一篇人物专访，动辄几千上万。客来宝把策划、撰稿、发布打包，会员专享补贴价349元/次起。这不是买卖，就是想让你和客来宝交个朋友。"}
          </p>
          <p className="note">
            {"套餐价格与媒体组合有效期为180天，具体咨询客服为准。"}
          </p>
        </div>
      </section>
      <section className="area alt" id="services">
        <div className="shell">
          <div className="area-kicker">
            {"四档套餐"}
          </div>
          <h2>
            {"按你要讲什么选，不必先懂媒体"}
          </h2>
          <div className="cards two">
            <article className="card">
              <h3>
                {"套餐一 · 个人IP背书套餐"}
              </h3>
              <p style={{"color": "#004090", "fontWeight": 800, "marginBottom": "10px"}}>
                {"「个人专访 · 权威立人设」"}
              </p>
              <strong style={{"display": "block", "fontSize": "34px", "color": "#004090", "lineHeight": "1.4"}}>
                {"¥349"}
                <span style={{"fontSize": "13px"}}>
                  {"/次（会员价）"}
                </span>
              </strong>
              <p>
                {"特供价 ¥698 · "}
                <s>
                  {"标准价 ¥3698"}
                </s>
                {"（会员补贴50%）"}
              </p>
              <p>
                <b>
                  {"面向人群："}
                </b>
                {"高阶顾问、保险/美业/直销等自雇人群及创业者"}
              </p>
              <p>
                <b>
                  {"涵盖场景："}
                </b>
                {"个人创业故事、行业访谈、达人专访"}
              </p>
              <p>
                <b>
                  {"涵盖行业："}
                </b>
                {"全行业通用（大健康、美业、保险、教育等）"}
              </p>
              <p>
                <b>
                  {"媒体组合："}
                </b>
                {"任选1家主流门户媒体（如腾讯、新浪、网易、搜狐、中华网、头条号、凤凰网、中国日报网等）为新闻源 + 1家地方媒体 + 3家行业媒体 + 5家全网媒体转载发布"}
              </p>
              <p>
                {"会员限时专享：送修稿、审稿等价值服务，同时按特供价补贴50%费用。"}
              </p>
            </article>
            <article className="card">
              <h3>
                {"套餐二 · 团队招商套餐"}
              </h3>
              <p style={{"color": "#004090", "fontWeight": 800, "marginBottom": "10px"}}>
                {"「全国招商 · 团队品牌赋能」"}
              </p>
              <strong style={{"display": "block", "fontSize": "34px", "color": "#004090", "lineHeight": "1.4"}}>
                {"¥399"}
                <span style={{"fontSize": "13px"}}>
                  {"/次（会员价）"}
                </span>
              </strong>
              <p>
                {"特供价 ¥798 · "}
                <s>
                  {"标准价 ¥3798"}
                </s>
                {"（会员补贴50%）"}
              </p>
              <p>
                <b>
                  {"面向人群："}
                </b>
                {"大健康/美业/社交电商的大团队长、核心组织者"}
              </p>
              <p>
                <b>
                  {"涵盖场景："}
                </b>
                {"团队风采报道、招商政策发布、团队月度/年度优秀榜单、项目报道、全员造势"}
              </p>
              <p>
                <b>
                  {"涵盖行业："}
                </b>
                {"全国招商、大健康、美业、本地生活团购等"}
              </p>
              <p>
                <b>
                  {"媒体组合："}
                </b>
                {"任选1家财经/商界/创业类知名垂直媒体 + 1家地方主流新闻网（覆盖搜索引擎首页）+ 10家全网媒体转载发布"}
              </p>
              <p>
                {"会员限时专享：送专访、拟稿、审稿等价值千元的服务，同时按特供价补贴50%费用。"}
              </p>
            </article>
            <article className="card">
              <h3>
                {"套餐三 · 品牌与项目专项套餐"}
              </h3>
              <p style={{"color": "#004090", "fontWeight": 800, "marginBottom": "10px"}}>
                {"「项目报道 · 产品背书」"}
              </p>
              <strong style={{"display": "block", "fontSize": "34px", "color": "#004090", "lineHeight": "1.4"}}>
                {"¥449"}
                <span style={{"fontSize": "13px"}}>
                  {"/次（会员价）"}
                </span>
              </strong>
              <p>
                {"特供价 ¥898 · "}
                <s>
                  {"标准价 ¥3898"}
                </s>
                {"（会员补贴50%）"}
              </p>
              <p>
                <b>
                  {"面向人群："}
                </b>
                {"有自建产品/独家代理项目的创业团队、大健康及抗衰美业运营者"}
              </p>
              <p>
                <b>
                  {"涵盖场景："}
                </b>
                {"新产品上市发布、科普教育、品牌故事、资质与技术认可"}
              </p>
              <p>
                <b>
                  {"涵盖行业："}
                </b>
                {"大健康（养生/抗衰/营养品）、美业（护肤/医美）、科技/本地生活"}
              </p>
              <p>
                <b>
                  {"媒体组合："}
                </b>
                {"12~15家健康/消费/时尚类专业媒体（含微信公众号/头条号全网铺发）"}
              </p>
              <p>
                {"会员限时专享：送专访、拟稿、审稿等价值千元的服务，同时按特供价补贴50%费用。"}
              </p>
            </article>
            <article className="card">
              <h3>
                {"套餐四 · 线下活动热播套餐"}
              </h3>
              <p style={{"color": "#004090", "fontWeight": 800, "marginBottom": "10px"}}>
                {"「活动发布 · 全网爆破」"}
              </p>
              <strong style={{"display": "block", "fontSize": "34px", "color": "#004090", "lineHeight": "1.4"}}>
                {"¥888"}
                <span style={{"fontSize": "13px"}}>
                  {"/次（会员价）"}
                </span>
              </strong>
              <p>
                {"特供价 ¥1,776 · "}
                <s>
                  {"标准价 ¥5776"}
                </s>
                {"（会员补贴50%）"}
              </p>
              <p>
                <b>
                  {"面向人群："}
                </b>
                {"举办线下研讨会、周年庆典、表彰大会、新品发布会的大型团队与机构"}
              </p>
              <p>
                <b>
                  {"涵盖场景："}
                </b>
                {"线下活动预热、现场盛况报道、峰会精彩回顾、全国品宣"}
              </p>
              <p>
                <b>
                  {"涵盖行业："}
                </b>
                {"全行业"}
              </p>
              <p>
                <b>
                  {"媒体组合："}
                </b>
                {"20+家全网核心媒体矩阵 + 搜索引擎新闻源强收录"}
              </p>
              <p>
                {"会员限时专享：送专访、拟稿、审稿等价值千元的服务，同时按特供价补贴50%费用。"}
              </p>
            </article>
          </div>
          <div className="inline-action">
            <Link className="btn" href="/media/packages">
              {"查看套餐明细 →"}
            </Link>
          </div>
        </div>
      </section>
      <section className="area" id="method">
        <div className="shell">
          <div className="area-kicker">
            {"4步流程"}
          </div>
          <h2>
            {"你只管讲故事，剩下的交给我们"}
          </h2>
          <div className="step-list">
            <div className="step">
              <b>
                {"01"}
              </b>
              <h3>
                {"聊方向"}
              </h3>
              <p>
                {"告诉我们你是谁，想让别人了解什么。"}
              </p>
            </div>
            <div className="step">
              <b>
                {"02"}
              </b>
              <h3>
                {"给素材"}
              </h3>
              <p>
                {"口述经历、照片、活动信息，越真实越好。"}
              </p>
            </div>
            <div className="step">
              <b>
                {"03"}
              </b>
              <h3>
                {"审稿子"}
              </h3>
              <p>
                {"我们写成稿，你确认事实无误再发布。"}
              </p>
            </div>
            <div className="step">
              <b>
                {"04"}
              </b>
              <h3>
                {"等发布"}
              </h3>
              <p>
                {"协调媒体发布，反馈链接给你。转发、使用，随你。"}
              </p>
            </div>
          </div>
          <img className="infographic" src="/visual/operations/flow-04.webp" loading="lazy" alt="媒体服务四步流程图" width="1600" height="570" decoding="async" />
        </div>
      </section>
      <section className="area alt" id="faq">
        <div className="shell">
          <div className="area-kicker">
            {"常见问题"}
          </div>
          <h2>
            {"没接触过媒体，也能从这里开始"}
          </h2>
          <div className="cards">
            <article className="card">
              <h3>
                {"没写过稿子能做吗？"}
              </h3>
              <p>
                {"能。你讲，我们整理成稿。"}
              </p>
            </article>
            <article className="card">
              <h3>
                {"能保证发到某家媒体吗？"}
              </h3>
              <p>
                {"不能。是否刊发取决于选题与媒体审核，我们按确认的组合尽力协调。"}
              </p>
            </article>
            <article className="card">
              <h3>
                {"必须是付费会员吗？"}
              </h3>
              <p>
                {"付费会员可享有50%补贴，也可单独购买（无补贴）。"}
              </p>
            </article>
            <article className="card">
              <h3>
                {"报道能用来招生/招商吗？"}
              </h3>
              <p>
                {"能。发一次，朋友圈、群、队员都能长期用。"}
              </p>
            </article>
          </div>
        </div>
      </section>
      <section className="area" id="end">
        <div className="shell">
          <div className="area-kicker">
            {"从一个真实的故事开始"}
          </div>
          <h2>
            {"你的故事，值得一次正式的表达。"}
          </h2>
          <div className="inline-action">
            <WechatContactButton className="btn" label="咨询媒体服务 →" source="media" />
          </div>
        </div>
      </section>
    </div>
  );
}
