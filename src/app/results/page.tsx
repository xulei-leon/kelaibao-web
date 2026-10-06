import styles from "@/components/policy/simple-policy-page.module.css";
import { StaticPageStructuredData } from "@/components/static-page-structured-data";
import { createPageMetadata } from "@/lib/route-metadata";

export const metadata = createPageMetadata("/results");

export default function ResultsPage() {
  return (
    <>
      <StaticPageStructuredData route="/results" />
      <article className={styles.page}>
        <div className={styles.content}>
        <h1>效果与责任说明</h1>
        <div className={styles.copy}>
          <p>客来宝提供数字化工具和技术支持。</p>
          <p>工具可以帮助用户提升内容展示效率、沟通效率和经营效率。</p>
          <p>但实际业务结果会受到：</p>
          <p>个人投入程度、行业环境、市场变化、执行方式等多方面因素影响。</p>
          <p>平台不承诺任何固定收益、客户数量或商业结果。</p>
          <p>用户应根据自身情况合理使用平台工具。</p>
        </div>
        </div>
      </article>
    </>
  );
}
