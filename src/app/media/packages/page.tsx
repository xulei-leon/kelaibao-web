import Link from "next/link";
import { MiniProgramTrialButton } from "@/components/mini-program-trial";
import { WechatContactButton } from "@/components/wechat-contact";
import { OperationsHero } from "@/components/operations-hero";
import { StaticPageStructuredData } from "@/components/static-page-structured-data";
import { createPageMetadata } from "@/lib/route-metadata";

export const metadata = createPageMetadata("/media/packages");

export default function PackagesPage() {
  return (
    <div className="ops-page">
      <StaticPageStructuredData route="/media/packages" />
      <section className="area">
        <div className="shell">
          <div className="area-kicker">
            {"客来宝（K-Link Future）会员专享媒体套餐"}
          </div>
          <h1>
            {"四档套餐明细"}
          </h1>
          <p className="intro">
            {"一次发稿，朋友圈、社群、团队、新人全都能用。套餐价格与媒体组合有效期为180天，具体咨询客服为准。"}
          </p>
          <div className="card" style={{"marginBottom": "16px"}}>
            <h3>
              {"套餐一 · 个人IP背书套餐"}
            </h3>
            <p style={{"color": "#004090", "fontWeight": 800, "margin": "6px 0 10px"}}>
              {"「个人专访 · 权威立人设」"}
            </p>
            <strong style={{"display": "block", "fontSize": "32px", "color": "#004090"}}>
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
                {"媒体组合示例："}
              </b>
              {"任选1家主流门户媒体（如腾讯、新浪、网易、搜狐、中华网、头条号、凤凰网、中国日报网等）为新闻源 + 1家地方媒体 + 3家行业媒体 + 5家全网媒体转载发布"}
            </p>
            <p>
              {"会员限时专享：送修稿、审稿等价值服务，同时按特供价补贴50%费用。"}
            </p>
          </div>
          <div className="card" style={{"marginBottom": "16px"}}>
            <h3>
              {"套餐二 · 团队招商套餐"}
            </h3>
            <p style={{"color": "#004090", "fontWeight": 800, "margin": "6px 0 10px"}}>
              {"「全国招商 · 团队品牌赋能」"}
            </p>
            <strong style={{"display": "block", "fontSize": "32px", "color": "#004090"}}>
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
                {"媒体组合示例："}
              </b>
              {"任选1家财经/商界/创业类知名垂直媒体 + 1家地方主流新闻网（覆盖搜索引擎首页）+ 10家全网媒体转载发布"}
            </p>
            <p>
              {"会员限时专享：送专访、拟稿、审稿等价值千元的服务，同时按特供价补贴50%费用。"}
            </p>
          </div>
          <div className="card" style={{"marginBottom": "16px"}}>
            <h3>
              {"套餐三 · 品牌与项目专项套餐"}
            </h3>
            <p style={{"color": "#004090", "fontWeight": 800, "margin": "6px 0 10px"}}>
              {"「项目报道 · 产品背书」"}
            </p>
            <strong style={{"display": "block", "fontSize": "32px", "color": "#004090"}}>
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
                {"媒体组合示例："}
              </b>
              {"12~15家健康/消费/时尚类专业媒体（含微信公众号/头条号全网铺发）"}
            </p>
            <p>
              {"会员限时专享：送专访、拟稿、审稿等价值千元的服务，同时按特供价补贴50%费用。"}
            </p>
          </div>
          <div className="card" style={{"marginBottom": "16px"}}>
            <h3>
              {"套餐四 · 线下活动热播套餐"}
            </h3>
            <p style={{"color": "#004090", "fontWeight": 800, "margin": "6px 0 10px"}}>
              {"「活动发布 · 全网爆破」"}
            </p>
            <strong style={{"display": "block", "fontSize": "32px", "color": "#004090"}}>
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
                {"媒体组合示例："}
              </b>
              {"20+家全网核心媒体矩阵 + 搜索引擎新闻源强收录"}
            </p>
            <p>
              {"会员限时专享：送专访、拟稿、审稿等价值千元的服务，同时按特供价补贴50%费用。"}
            </p>
          </div>
          <div className="inline-action">
            <WechatContactButton className="btn" label="咨询媒体服务 →" source="packages" />
          </div>
        </div>
      </section>
    </div>
  );
}
