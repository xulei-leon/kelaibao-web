import styles from "@/components/policy/simple-policy-page.module.css";
import { createPageMetadata } from "@/lib/route-metadata";
import { StaticPageStructuredData } from "@/components/static-page-structured-data";

export const metadata = createPageMetadata("/disclaimer");

export default function DisclaimerPage() {
  return (
    <>
      <StaticPageStructuredData route="/disclaimer" />
      <article className={styles.page} id="principles">
        <div className={styles.content}>
        <h1>用户行为规范</h1>
        <div className={styles.copy}>
          <p>客来宝倡导真实、健康、有价值的数字化表达方式。</p>
          <p>用户在平台发布、展示、分享的内容，应确保来源真实、合法，并尊重他人的知识产权、隐私权及合法权益。</p>
          <p>用户不得利用平台：</p>
          <ol>
            <li>1. 发布虚假信息</li>
            <li>2. 进行违法违规宣传</li>
            <li>3. 侵害他人权益</li>
            <li>4. 从事任何违反法律法规的行为</li>
          </ol>
          <p>客来宝鼓励用户通过真实内容建立信任，通过长期价值创造连接。</p>
          <p id="results">对于违反法律法规或平台规则的行为，客来宝有权依据相关规定采取必要管理措施，包括限制功能使用、下架相关内容等。</p>
        </div>
        </div>
      </article>
    </>
  );
}
