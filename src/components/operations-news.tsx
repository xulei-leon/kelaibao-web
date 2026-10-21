import Link from "next/link";
import type { PublicArticle } from "@/content/article-types";
import { OperationsHero } from "@/components/operations-hero";

const categories: Record<string, string> = {
  "article-a": "品牌认知", "article-b": "获客方法",
  "article-d1": "团队小程序", "article-d2": "媒体传播", "article-e2": "官方公告",
};

export function OperationsNews({ items }: { items: PublicArticle[] }) {
  function cards(articles: PublicArticle[]) {
    return <div className="newsgrid">{articles.map((item) => (
      <article className="news-item" key={item.slug}>
        <small>{categories[item.slug] ?? "新闻动态"}</small>
        <h3><Link href={`/news/${item.slug}`}>{item.title}</Link></h3>
        <p>{item.summary}</p>
        <time dateTime={item.firstPublishedAt.toISOString()}>{item.firstPublishedAt.toLocaleDateString("zh-CN", { timeZone: "Asia/Shanghai" })}</time>
        <p><Link className="context-link" href={`/news/${item.slug}`}>阅读全文 →</Link></p>
      </article>
    ))}</div>;
  }
  const stories = items.filter((item) => item.slug !== "article-e2");
  const announcements = items.filter((item) => item.slug === "article-e2");
  return <div className="ops-page">
    <OperationsHero image="news"><div className="shell hero-inner">
      <div className="tag">NEWS · 内容中心</div><h1>先看懂，再决定。</h1>
      <p>深度长文与官方公告——所有你想问的，这里都有答案。</p>
      <div className="hero-actions"><a className="btn" href="#list">浏览深度长文 →</a><Link className="btn btn-secondary" href="/trial">直接免费试用</Link></div>
    </div></OperationsHero>
    <section className="area" id="list"><div className="shell"><div className="area-kicker">深度长文</div><h2>从这里，了解客来宝</h2>
      {stories.length ? cards(stories) : <p className="public-content-empty">当前没有已公开的新闻。</p>}
    </div></section>
    {announcements.length ? <section className="area alt"><div className="shell"><div className="area-kicker">官方公告</div><h2>官网独家发布</h2>{cards(announcements)}</div></section> : null}
    <section className="area alt"><div className="shell"><div className="area-kicker">第三方报道与测评</div><h2>外部视角看客来宝</h2><div className="newsgrid">
      <a className="news-item" href="https://www.toutiao.com/article/7664499080706163206/" target="_blank" rel="noopener noreferrer"><small>今日头条 · 凤凰网财富（2026-07-20）</small><h3>客来宝K-Link上线，以内容生态赋能创业微光</h3><p>以“拓客工具+价值内容驱动”的一站式拓客系统，助力私域创业者跨越流量鸿沟。</p><p>阅读原文 →</p></a>
    </div></div></section>
    <section className="area"><div className="shell"><div className="area-kicker">会员传播案例</div><h2>每个故事，都从真实经历开始</h2><p className="intro">了解人物专访、团队报道与活动发布的服务方式。</p><Link className="btn" href="/media">了解媒体服务 →</Link></div></section>
  </div>;
}
