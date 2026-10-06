"use client";

import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="status-page" role="alert">
      <AlertTriangle aria-hidden="true" className="status-page__icon" size={42} />
      <p className="eyebrow">客来宝页面暂时不可用</p>
      <h1>我们没有加载出这部分内容</h1>
      <p>页面不会显示内部错误内容。您可以重新尝试，或使用稳定联系页面继续。</p>
      <div className="hero-actions">
        <button className="cta cta--navy-secondary" onClick={reset} type="button"><RotateCcw aria-hidden="true" size={18} />重新尝试</button>
        <Link className="cta cta--wechat-primary" href="/about#contact">前往联系页</Link>
      </div>
    </section>
  );
}
