import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { DIRECT_SALES_SITUATIONS } from "@/lib/site-content";

export function DirectSalesFocus() {
  return (
    <div className="direct-sales-focus">
      <div className="direct-sales-focus__intro">
        <span className="direct-sales-focus__label">首页第一服务场景</span>
        <h3>先解决直销从业表达中最常见的三个卡点</h3>
        <p>
          不从包装或流量承诺开始，而是先把真实经历、长期内容与发布边界整理成可继续维护的基础。
        </p>
        <Link className="editorial-link" href="/media#direct-sales">
          <span>查看直销解决方案</span>
          <ArrowRight aria-hidden="true" size={18} strokeWidth={1.8} />
        </Link>
      </div>
      <ol className="direct-sales-situations">
        {DIRECT_SALES_SITUATIONS.map((situation) => (
          <li key={situation.number}>
            <span>{situation.number}</span>
            <div>
              <h3>{situation.title}</h3>
              <p>{situation.problem}</p>
              <strong>{situation.outcome}</strong>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
