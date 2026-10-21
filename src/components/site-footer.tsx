import Link from "next/link";
import { MiniProgramTrialButton } from "@/components/mini-program-trial";
import { BRAND, GLOBAL_CLAIMS_BOUNDARY } from "@/lib/site-content";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-container">
        <div className="site-footer__top">
          <div className="site-footer__brand">
            <span className="footer-kicker">K-Link 一站式拓客工具系统</span>
            <h2>{BRAND.name}</h2>
            <p>{BRAND.promise}</p>
            <MiniProgramTrialButton
              label="免费体验"
              source="footer"
              compact
            />
          </div>
          <div className="site-footer__nav">
            <div>
              <h3>产品与服务</h3>
              <Link href="/trial">试用会员</Link>
              <Link href="/features">会员服务</Link>
              <Link href="/team">团队效率</Link>
              <Link href="/media">媒体服务</Link>
              <Link href="/media/packages">媒体套餐</Link>
            </div>
            <div>
              <h3>了解客来宝</h3>
              <Link href="/news">新闻动态</Link>
              <Link href="/about">关于我们</Link>
              <Link href="/about#contact">联系我们</Link>
            </div>
            <div>
              <h3>政策与使用原则</h3>
              <Link href="/privacy">隐私保护原则</Link>
              <Link href="/terms">技术中立原则</Link>
              <Link href="/disclaimer">用户行为规范</Link>
              <Link href="/results">效果与责任说明</Link>
            </div>
          </div>
        </div>
        <div className="site-footer__bottom">
          <p>{GLOBAL_CLAIMS_BOUNDARY}</p>
          <div className="site-footer__legal">
            <p>© 2026 K-Link 客来宝。All rights reserved.</p>
            <p>运营主体：小未来商务服务（深圳）有限公司</p>
            <p>
              ICP 备案号：
              <a
                href="https://beian.miit.gov.cn/"
                target="_blank"
                rel="noopener noreferrer"
              >
                粤 ICP 备 2025362743 号
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
