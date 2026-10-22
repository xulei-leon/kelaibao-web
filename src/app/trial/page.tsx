import Link from "next/link";
import { MiniProgramTrialButton } from "@/components/mini-program-trial";
import { WechatContactButton } from "@/components/wechat-contact";
import { OperationsHero } from "@/components/operations-hero";
import { StaticPageStructuredData } from "@/components/static-page-structured-data";
import { createPageMetadata } from "@/lib/route-metadata";

export const metadata = createPageMetadata("/trial");

export default function TrialPage() {
  return (
    <div className="ops-page">
      <StaticPageStructuredData route="/trial" />
      <OperationsHero image="trial">
        <div className="shell hero-inner">
          <div className="tag">
            {"FREE · 免费发现页"}
          </div>
          <h1>
            {"先免费试试，1分钟就知道好不好用。"}
          </h1>
          <p>
            {"打开发现页，挑一篇你愿意读的内容，读完再决定分不分享。不花钱，先感受。"}
          </p>
          <div className="hero-actions">
            <MiniProgramTrialButton className="btn" label="打开免费发现页 →" source="trial" />
            <Link className="btn btn-secondary" href="#compare">
              {"免费和年费区别在哪？"}
            </Link>
          </div>
        </div>
      </OperationsHero>
      <section className="area" id="steps">
        <div className="shell">
          <div className="area-kicker">
            {"第一次用"}
          </div>
          <h2>
            {"四步，完成你的第一次分享"}
          </h2>
          <div className="step-list">
            <div className="step">
              <b>
                {"01"}
              </b>
              <h3>
                {"打开"}
              </h3>
              <p>
                {"微信里进入客来宝（K-Link Future），登录会员中心，上传个人二维码，免费使用。"}
              </p>
            </div>
            <div className="step">
              <b>
                {"02"}
              </b>
              <h3>
                {"挑一篇"}
              </h3>
              <p>
                {"选一篇你自己愿意读、群友可能感兴趣的。先读完，再决定。"}
              </p>
            </div>
            <div className="step">
              <b>
                {"03"}
              </b>
              <h3>
                {"发出去"}
              </h3>
              <p>
                {"发到允许分享的群或朋友圈，看看排版和底部的联系入口。"}
              </p>
            </div>
            <div className="step">
              <b>
                {"04"}
              </b>
              <h3>
                {"看回响"}
              </h3>
              <p>
                {"有人点开、有人加你——从这一刻起，你就知道它值不值。（访客轨迹VIP可见）"}
              </p>
            </div>
          </div>
          <img className="infographic" src="/visual/operations/flow-02.webp" loading="lazy" alt="免费体验到会员流程图" width="1600" height="570" decoding="async" />
        </div>
      </section>
      <section className="area alt" id="compare">
        <div className="shell">
          <div className="area-kicker">
            {"免费和年费区别在哪？"}
          </div>
          <h2>
            {"当你发现每天都需要它"}
          </h2>
          <div className="compare-scroll" tabIndex={0} role="region" aria-label="免费试用与年费会员权益对比">
          <table className="compare">
            <thead>
              <tr>
                <th scope="col">
                  {"功能"}
                </th>
                <th scope="col">
                  {"免费试用"}
                </th>
                <th scope="col">
                  {"年费会员 ¥599/年"}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  {"发现页开放内容"}
                </td>
                <td>
                  {"✅"}
                </td>
                <td>
                  {"✅"}
                </td>
              </tr>
              <tr>
                <td>
                  {"资源集市发帖找合作"}
                </td>
                <td>
                  {"✅"}
                </td>
                <td>
                  {"✅"}
                </td>
              </tr>
              <tr>
                <td>
                  {"主题社群浏览"}
                </td>
                <td>
                  {"✅"}
                </td>
                <td>
                  {"✅"}
                </td>
              </tr>
              <tr>
                <td>
                  {"上传自己的社群入口"}
                </td>
                <td>
                  {"—"}
                </td>
                <td>
                  {"✅"}
                </td>
              </tr>
              <tr>
                <td>
                  {"会员专区9+内容模块（日更/周更）"}
                </td>
                <td>
                  {"—"}
                </td>
                <td>
                  {"✅"}
                </td>
              </tr>
              <tr>
                <td>
                  {"转发自动带个人二维码+数字名片"}
                </td>
                <td>
                  {"部分"}
                </td>
                <td>
                  {"✅"}
                </td>
              </tr>
              <tr>
                <td>
                  {"数字名片"}
                </td>
                <td>
                  {"—"}
                </td>
                <td>
                  {"✅"}
                </td>
              </tr>
              <tr>
                <td>
                  {"访客轨迹"}
                </td>
                <td>
                  {"—"}
                </td>
                <td>
                  {"✅"}
                </td>
              </tr>
              <tr>
                <td>
                  {"行业专刊"}
                </td>
                <td>
                  {"—"}
                </td>
                <td>
                  {"✅"}
                </td>
              </tr>
              <tr>
                <td>
                  {"团队小程序"}
                </td>
                <td>
                  {"—"}
                </td>
                <td>
                  {"✅"}
                </td>
              </tr>
              <tr>
                <td>
                  {"媒体全程服务与补贴"}
                </td>
                <td>
                  {"—"}
                </td>
                <td>
                  {"✅"}
                </td>
              </tr>
              <tr>
                <td>
                  {"新功能免费升级"}
                </td>
                <td>
                  {"—"}
                </td>
                <td>
                  {"✅"}
                </td>
              </tr>
            </tbody>
          </table>
          </div>
        </div>
      </section>
      <section className="area" id="reassure">
        <div className="shell">
          <div className="area-kicker">
            {"给谨慎的你"}
          </div>
          <h2>
            {"先感受，再决定"}
          </h2>
          <p className="intro">
            {"不用先交钱，也不用先听完所有介绍。打开发现页，挑一篇你愿意读的，读完再决定分不分享。觉得顺手，你自然会每天打开它。"}
          </p>
          <div className="inline-action">
            <MiniProgramTrialButton className="btn" label="打开免费发现页 →" source="trial" />
          </div>
        </div>
      </section>
      <section className="area alt" id="upgrade">
        <div className="shell">
          <div className="area-kicker">
            {"下一步"}
          </div>
          <h2>
            {"先免费用着。觉得值，再开通，不迟。"}
          </h2>
          <div className="inline-action">
            <Link className="btn" href="/features">
              {"看看会员服务 →"}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
