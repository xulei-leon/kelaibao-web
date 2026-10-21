import Link from "next/link";
import { MiniProgramTrialButton } from "@/components/mini-program-trial";
import { WechatContactButton } from "@/components/wechat-contact";
import { OperationsHero } from "@/components/operations-hero";
import { StaticPageStructuredData } from "@/components/static-page-structured-data";
import { createPageMetadata } from "@/lib/route-metadata";
import { ImageLightbox } from "@/components/image-lightbox";

export const metadata = createPageMetadata("/about");

export default function AboutPage() {
  return (
    <div className="ops-page">
      <StaticPageStructuredData route="/about" />
      <OperationsHero image="about">
        <div className="shell hero-inner">
          <div className="tag">
            {"ABOUT · 关于客来宝"}
          </div>
          <h1>
            {"我们提供工具，连接由你决定。"}
          </h1>
          <p>
            {"内容供应、个人展示、团队协同——让普通人把社交经营做得轻松一点。"}
          </p>
          <div className="hero-actions">
            <Link className="btn" href="#story">
              {"了解客来宝的原则 →"}
            </Link>
            <Link className="btn btn-secondary" href="#faq">
              {"查看常见问题"}
            </Link>
          </div>
        </div>
      </OperationsHero>
      <section className="area" id="story">
        <div className="shell">
          <div className="area-kicker">
            {"关于客来宝"}
          </div>
          <h2>
            {"专注私域经营工具的研发"}
          </h2>
          <p className="intro">
            {"客来宝专注私域经营工具的研发，为带团队的经营者、大健康与成长型销售团队提供内容协同与客户经营工具。由资深互联网软件技术专家与长期深耕微信社群经营场景的顾问联合打造。"}
          </p>
          <p className="intro">
            {"客来宝旗下小程序K-Link（K-Link Future）将内容、数据与团队运营能力深度结合，帮助个人提升专业度与拓客效率，帮助团队建立统一、可复制、可沉淀的运营体系。从个人拓客到团队运营，从内容传播到客户沉淀，客来宝始终坚持：让每一次连接都能体现专业、建立人设。"}
          </p>
          <p className="intro">
            {"运营主体：小未来商务服务（深圳）有限公司。平台引入行业资深创投基金共同投资，成立深圳小未来数字信息有限公司，负责后续的工具平台服务。官网：www.klinktool.com（粤ICP备2025362743号）。"}
          </p>
        </div>
      </section>
      <section className="area alt" id="culture">
        <div className="shell">
          <div className="area-kicker">
            {"企业文化"}
          </div>
          <h2>
            {"我们相信什么"}
          </h2>
          <div className="cards">
            <article className="card">
              <h3>
                {"品牌愿景"}
              </h3>
              <p>
                {"成为带团队的人长期可信赖的经营伙伴。"}
              </p>
            </article>
            <article className="card">
              <h3>
                {"核心理念"}
              </h3>
              <p>
                {"用工具降低获客门槛，用内容提升专业表达，用数据驱动团队增长。"}
              </p>
            </article>
            <article className="card">
              <h3>
                {"团队使命"}
              </h3>
              <p>
                {"让优秀经验实现规模化复制，让团队增长更加稳定、长久、可持续。"}
              </p>
            </article>
          </div>
        </div>
      </section>
      <section className="area" id="security">
        <div className="shell">
          <div className="area-kicker">
            {"安全与合规"}
          </div>
          <h2>
            {"三条底线，写在前面"}
          </h2>
          <div className="cards">
            <article className="card">
              <h3>
                {"0隐私采集"}
              </h3>
              <p>
                {"无需实名认证，不采集通讯录，不获取敏感隐私。用户始终具有主动选择权，从源头杜绝泄露。"}
              </p>
            </article>
            <article className="card">
              <h3>
                {"0业务干预"}
              </h3>
              <p>
                {"客来宝专注技术服务，不参与团队管理，不触碰组织架构，不干预团队运营，充分保障业务自主权。"}
              </p>
            </article>
            <article className="card">
              <h3>
                {"100%私域归属"}
              </h3>
              <p>
                {"专属数据加密与独立存储，由底层代码自动执行技术归集——谁分享，数据和客户就归谁。用户线索、私域沉淀绝对保密，只属于用户个人。"}
              </p>
            </article>
          </div>
        </div>
      </section>
      <section className="area alt" id="numbers">
        <div className="shell">
          <div className="area-kicker">
            {"运营数据"}
          </div>
          <h2>
            {"已经有不少人在用"}
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
          <p className="note" style={{"marginTop": "16px"}}>
            {"工具提升效率，不承诺获客数量与成交。"}
          </p>
        </div>
      </section>
      <section className="area" id="visit"><div className="shell"><div className="area-kicker">公司实景与到访指引</div><h2>欢迎来坐坐</h2><div className="cards two"><article className="card"><h3>公司实景</h3><ImageLightbox alt="客来宝办公室场景" height={1456} label="查看办公室场景大图" preview={false} showOriginalLink={false} src="/brand/office-scenes.png" triggerText="点击查看" width={1435} /></article><article className="card"><h3>到访指引</h3><ImageLightbox alt="客来宝办公室到访指引" height={5584} label="查看到访指引大图" modalClassName="image-lightbox--tall" preview={false} showOriginalLink={false} src="/brand/arrival-guide.webp" triggerText="点击查看" width={1500} /></article></div></div></section>
      <section className="area" id="contact">
        <div className="shell">
          <div className="area-kicker">
            {"联系我们"}
          </div>
          <h2>
            {"扫码找到我们"}
          </h2>
          <div className="cards two">
            <article className="card" style={{"textAlign": "center"}}>
              <img src="/wechat/k-link-mini-program-qr.png" alt="K-Link小程序二维码" style={{"width": "170px", "height": "170px", "objectFit": "contain"}} width="750" height="750" decoding="async" loading="lazy" />
              <h3 style={{"marginTop": "12px"}}>
                {"小程序"}
              </h3>
              <p>
                {"微信扫码体验K-Link；移动端可长按识别。"}
              </p>
            </article>
            <article className="card" style={{"textAlign": "center"}}>
              <img src="/wechat/kelaibao-official-account-qr.png" alt="客来宝公众号二维码" style={{"width": "170px", "height": "170px", "objectFit": "contain"}} width="750" height="750" decoding="async" loading="lazy" />
              <h3 style={{"marginTop": "12px"}}>
                {"公众号"}
              </h3>
              <p>
                {"微信扫码关注客来宝公众号。"}
              </p>
            </article>
            <article className="card" style={{"textAlign": "center"}}>
              <img src="/wechat/kelaibao-video-channel-qr.png" alt="客来宝视频号二维码" style={{"width": "170px", "height": "170px", "objectFit": "contain"}} width="750" height="750" decoding="async" loading="lazy" />
              <h3 style={{"marginTop": "12px"}}>
                {"视频号"}
              </h3>
              <p>
                {"微信扫码关注客来宝视频号。"}
              </p>
            </article>
            <article className="card" style={{"textAlign": "center"}}>
              <img src="/wechat/kelaibao-enterprise-wechat-qr.png" alt="客来宝企业微信二维码" style={{"width": "170px", "height": "170px", "objectFit": "contain"}} width="750" height="750" decoding="async" loading="lazy" />
              <h3 style={{"marginTop": "12px"}}>
                {"企业微信"}
              </h3>
              <p>
                {"微信扫码咨询客来宝顾问。"}
              </p>
            </article>
          </div>
        </div>
      </section>
      <section className="area" id="faq">
        <div className="shell">
          <div className="area-kicker">
            {"20个常见问题"}
          </div>
          <h2>
            {"你可能还想知道这些"}
          </h2>
          <div className="qa">
            <details>
              <summary>
                {"客来宝是什么？"}
              </summary>
              <p>
                {"以内容供应为基础，带数字名片、团队协同的微信社群经营工具。简单说：它每天给你现成的好内容，你转发出去被记住；它还帮团队统一内容、各自沉淀客户。运营主体为小未来商务服务（深圳）有限公司。"}
              </p>
            </details>
            <details>
              <summary>
                {"谁适合用？"}
              </summary>
              <p>
                {"靠微信群和朋友圈做经营的人，以及带团队的负责人。特别是熟人快聊完、陌生人还没打开的阶段，以及需要给团队统一供内容的团队长。"}
              </p>
            </details>
            <details>
              <summary>
                {"年费多少钱？"}
              </summary>
              <p>
                {"¥599/年，官网、平台、小程序同价，公开透明。也可以问问你的团队长——他的资历或许能拿到专属优惠。"}
              </p>
            </details>
            <details>
              <summary>
                {"免费能用到什么？"}
              </summary>
              <p>
                {"发现页内容、资源集市发帖、主题社群浏览。登录会员中心、上传个人二维码后即可免费使用，先把流程走一遍，再决定要不要付费。"}
              </p>
            </details>
            <details>
              <summary>
                {"文章会夹带广告吗？"}
              </summary>
              <p>
                {"内容是纯知识资讯，无广告、无营销感；底部安静地放你的二维码和\"分享这一刻\"。这正是它能在群里长期分享的原因——群主不反感，群友不设防。"}
              </p>
            </details>
            <details>
              <summary>
                {"转发一定有人加我吗？"}
              </summary>
              <p>
                {"不保证。工具负责\"被看见、被记住\"，加不加好友取决于内容是否对口、你是否长期坚持、对方是否自愿。一般持续2–4周开始形成印象。"}
              </p>
            </details>
            <details>
              <summary>
                {"不是群主能分享吗？"}
              </summary>
              <p>
                {"群规允许就行；不允许的群别硬发。建议第一次分享前先私聊群主打个招呼——绝大多数群主欢迎能活跃气氛的好内容。"}
              </p>
            </details>
            <details>
              <summary>
                {"二维码怎么带上？"}
              </summary>
              <p>
                {"开通会员后，转发的内容自动带，不用你每次手动加。免费体验部分内容也支持，先试再决定。谁转发，底部就是谁的码，别人转你的文章也不会换成他的。"}
              </p>
            </details>
            <details>
              <summary>
                {"数字名片是干嘛的？"}
              </summary>
              <p>
                {"一页讲清你是谁、做什么、怎么联系。别人问\"你是做啥的\"，发一张名片就够了，不用每次重发长文字，还能被对方收藏，方便日后联系。"}
              </p>
            </details>
            <details>
              <summary>
                {"访客轨迹能看到谁？"}
              </summary>
              <p>
                {"能看到访问数据——谁看过、看过几次、谁收藏了你的名片，帮你判断谁是意向客户、先一步跟进。不是所有匿名访客都能识别身份，具体以工具实际功能为准。"}
              </p>
            </details>
            <details>
              <summary>
                {"行业专刊适合谁？"}
              </summary>
              <p>
                {"有自己公司/品牌，想把公开资料变成可转发内容的人。提交收录后，你的品牌内容就成了可分享的资讯，转发出去还带你的码，等于多了一个长期展示位。"}
              </p>
            </details>
            <details>
              <summary>
                {"团队小程序干嘛的？"}
              </summary>
              <p>
                {"团队长整理一次、持续迭代，队员直接进入、一键用统一内容，每篇自动带队员自己的码。对外形象统一，对内互不抢客户——谁分享，客户就是谁的。"}
              </p>
            </details>
            <details>
              <summary>
                {"团队人数有限制吗？"}
              </summary>
              <p>
                {"按实际方案配置，几百到几万人的团队都有对应方案，不承诺\"不限人数\"。建议先让一组核心成员试用，跑顺了再全员推广。"}
              </p>
            </details>
            <details>
              <summary>
                {"媒体服务多少钱？"}
              </summary>
              <p>
                {"会员349元/次起，共四档套餐（个人专访/团队报道/品牌项目/线下活动），有效期为180天，具体咨询客服为准。"}
              </p>
            </details>
            <details>
              <summary>
                {"必须是付费会员吗？"}
              </summary>
              <p>
                {"付费会员可享有50%补贴（349元/次起）；不是会员也可以单独购买，按特供价执行（无补贴）。"}
              </p>
            </details>
            <details>
              <summary>
                {"没稿子能做专访吗？"}
              </summary>
              <p>
                {"能，你讲我们写。从选题沟通、素材整理、专业撰稿到你审稿确认、发布协调，全程有人跟进，你只花聊天的功夫。"}
              </p>
            </details>
            <details>
              <summary>
                {"能保证发到指定媒体吗？"}
              </summary>
              <p>
                {"不能。是否刊发取决于选题价值与媒体审核，我们按确认的媒体组合尽力协调，并在发布后反馈链接。这是行业的实话，签约前先说清楚。"}
              </p>
            </details>
            <details>
              <summary>
                {"客来宝帮成交吗？"}
              </summary>
              <p>
                {"不。客来宝只提供工具和内容，成交、招募、合作都是你自己的事。我们遵循\"0业务干预\"原则，不参与你的团队管理。"}
              </p>
            </details>
            <details>
              <summary>
                {"客来宝会拿我的客户数据吗？"}
              </summary>
              <p>
                {"不会。0隐私采集：不读取通讯录，不需要手机号和实名，专属数据加密独立存储——谁分享，数据和客户就归谁，你的私域完全归你。"}
              </p>
            </details>
            <details>
              <summary>
                {"在哪开通会员？"}
              </summary>
              <p>
                {"在K-Link小程序的会员中心开通即可。也可以问问你的团队长，了解是否有专属优惠。"}
              </p>
            </details>
          </div>
        </div>
      </section>
    </div>
  );
}
