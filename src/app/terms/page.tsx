import styles from "@/components/policy/simple-policy-page.module.css";
import { createPageMetadata } from "@/lib/route-metadata";
import { StaticPageStructuredData } from "@/components/static-page-structured-data";

export const metadata = createPageMetadata("/terms");

export default function TermsPage() {
  return (
    <>
      <StaticPageStructuredData route="/terms" />
      <article className={styles.page}>
        <div className={styles.content}>
        <h1>技术中立原则</h1>
        <div className={styles.copy}>
          <p>客来宝是一套面向自雇创业者及个人经营者的数字化内容与展示工具系统。</p>
          <p>平台提供：</p>
          <ul>
            <li>1. 内容工具</li>
            <li>2. 展示工具</li>
            <li>3. 团队工具</li>
            <li>4. 引流工具</li>
            <li>5. 数据工具</li>
          </ul>
          <p>帮助用户提升个人表达效率和数字化经营能力。</p>
          <p>客来宝不参与用户之间的商业关系，不组织、不管理、不发展任何用户团队。</p>
          <p>平台不销售用户所展示的商品或服务，也不参与任何交易过程。</p>
          <p>用户之间产生的咨询、合作、交易及商业行为，均由用户双方自主决定并自行承担相关责任。</p>
          <p>客来宝始终坚持：</p>
          <p>
            提供工具，不参与业务；连接价值，不控制关系。
          </p>
        </div>
        </div>
      </article>
    </>
  );
}
