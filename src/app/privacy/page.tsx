import { createPageMetadata } from "@/lib/route-metadata";

import styles from "@/components/policy/simple-policy-page.module.css";
import { StaticPageStructuredData } from "@/components/static-page-structured-data";

export const metadata = createPageMetadata("/privacy");

export default function PrivacyPage() {
  return (
    <>
      <StaticPageStructuredData route="/privacy" />
      <article className={styles.page}>
        <div className={styles.content}>
        <h1>隐私保护原则</h1>
        <div className={styles.copy}>
          <p>小未来商务服务（深圳）有限公司（以下简称“客来宝”）高度重视每一位用户的信息安全与数字资产保护。</p>
          <p>客来宝定位为数字化工具服务平台，坚持“最小必要、用户自主、安全透明”的隐私保护原则。</p>
          <p>我们不会获取、读取或建立用户手机通讯录、私人社交关系链等非必要信息。</p>
          <p>用户在平台展示的个人资料、内容信息及公开页面，均由用户自主创建、授权和管理。</p>
          <p>平台仅在提供服务所必需的范围内，记录必要的账号信息及使用数据，用于保障系统运行、优化服务体验和维护平台安全。</p>
          <p>客来宝始终致力于为用户提供一个安心、透明、可信赖的数字化工具环境。</p>
        </div>
        </div>
      </article>
    </>
  );
}
