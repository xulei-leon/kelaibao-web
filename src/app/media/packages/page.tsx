import { QrCodeCard } from "@/components/qr-code-card";
import { StaticPageStructuredData } from "@/components/static-page-structured-data";
import { PageHero } from "@/components/ui/page-hero";
import { Section } from "@/components/ui/section";
import { WechatContactButton } from "@/components/wechat-contact";
import { createPageMetadata } from "@/lib/route-metadata";
import { WECHAT_CONTACT } from "@/lib/site-config";

export const metadata = createPageMetadata("/media/packages");

const MEDIA_PACKAGES = [
  {
    title: "套餐一｜个人 IP 背书",
    audience: "高阶顾问、保险 / 美业等自雇人群、创业者",
    purpose: "讲个人创业故事、行业访谈、达人专访，立住人设",
    distribution: "1 家主流门户（腾讯 / 新浪 / 网易 / 搜狐 / 头条 / 凤凰等）作新闻源 + 1 家地方媒体 + 3 家行业媒体 + 5 家全网转载",
    standardPrice: "¥698/次",
    memberPrice: "¥349",
    service: "补贴 50%，含修稿审稿",
  },
  {
    title: "套餐二｜团队招商",
    audience: "大健康 / 美业 / 社群电商的大团队主理人、核心组织者",
    purpose: "团队风采、招商政策、月度 / 年度榜单、项目报道、全员造势",
    distribution: "1 家财经 / 创业垂直媒体 + 1 家地方主流新闻网（覆盖搜索首页） + 10 家全网转载",
    standardPrice: "¥798/次",
    memberPrice: "¥399",
    service: "补贴 50%，含拟稿审稿",
  },
  {
    title: "套餐三｜品牌与项目",
    audience: "有自建产品 / 独家代理项目的创业团队、大健康与抗衰美业运营者",
    purpose: "新品发布、科普教育、品牌故事、资质技术认可",
    distribution: "12–15 家健康 / 消费 / 时尚类专业媒体（含公众号 / 头条号全网铺发）",
    standardPrice: "¥898/次",
    memberPrice: "¥449",
    service: "补贴 50%，含拟稿审稿",
  },
  {
    title: "套餐四｜线下活动热播",
    audience: "办线下研讨会、周年庆、表彰大会、新品发布的大型团队与机构",
    purpose: "活动预热、现场盛况、峰会回顾、全国品宣",
    distribution: "20+ 家全网核心媒体矩阵 + 搜索引擎新闻源强收录",
    standardPrice: "¥1,776/次",
    memberPrice: "¥888",
    service: "补贴 50%，含拟稿审稿",
  },
] as const;

export default function MediaPackagesPage() {
  return (
    <>
      <StaticPageStructuredData route="/media/packages" />
      <PageHero
        compact
        variant="editorial-dark"
        eyebrow="媒体服务"
        title="客来宝 K-Link 媒体套餐"
        lead="四套会员专享套餐"
        actions={<WechatContactButton label="咨询媒体报道" source="media-packages" />}
        boundary="套餐价格与媒体组合有效至 2026 年 12 月 13 日；具体媒体清单、审核条件和实际发布结果按项目确认。"
      />

      <Section tone="white" title="四套会员专享套餐">
        <div className="media-package-grid">
          {MEDIA_PACKAGES.map((item) => (
            <article className="media-package-card" key={item.title}>
              <h2>{item.title}</h2>
              <dl>
                <div><dt>适合谁</dt><dd>{item.audience}</dd></div>
                <div><dt>用来做什么</dt><dd>{item.purpose}</dd></div>
                <div><dt>媒体怎么发</dt><dd>{item.distribution}</dd></div>
                <div className="media-package-card__price"><dt>会员价</dt><dd><span>标准价 {item.standardPrice}</span><strong>会员专享 {item.memberPrice}</strong><small>（{item.service}）</small></dd></div>
              </dl>
            </article>
          ))}
        </div>
      </Section>

      <Section tone="navy" className="media-final-cta">
        <div className="media-final-cta__layout">
          <div className="narrow-dark-cta">
            <h2>开启你的媒体背书之路</h2>
            <WechatContactButton label="咨询媒体报道" source="media-packages-final" />
          </div>
          <QrCodeCard
            alt="客来宝媒体企业微信咨询二维码"
            description="使用微信扫码咨询；移动端可长按识别或保存后在微信中打开。"
            src={WECHAT_CONTACT.qrImagePath}
            title="企业微信"
          />
        </div>
      </Section>
    </>
  );
}
