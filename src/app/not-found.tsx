import Link from "next/link";
import { ArrowLeft, MessageCircle } from "lucide-react";

export default function NotFound() {
  return (
    <section className="status-page">
      <div className="status-page__code">404</div>
      <p className="eyebrow">页面未找到</p>
      <h1>这个地址暂时没有对应内容</h1>
      <p>请返回客来宝首页了解服务，或前往联系页开始人工咨询。</p>
      <div className="hero-actions">
        <Link className="cta cta--navy-secondary" href="/"><ArrowLeft aria-hidden="true" size={18} />返回首页</Link>
        <Link className="cta cta--wechat-primary" href="/about#contact"><MessageCircle aria-hidden="true" size={18} />联系我们</Link>
      </div>
    </section>
  );
}
