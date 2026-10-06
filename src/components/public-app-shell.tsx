"use client";

import { Suspense, type ReactNode } from "react";
import { usePathname } from "next/navigation";

import { AnalyticsPageView } from "@/components/analytics-page-view";
import { MiniProgramTrialProvider } from "@/components/mini-program-trial";
import { MobileContactBar } from "@/components/mobile-contact-bar";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { WechatContactProvider } from "@/components/wechat-contact";

export function isPublicAppPath(pathname: string | null): boolean {
  if (!pathname) return false;
  if (pathname === "/health") return false;
  return pathname !== "/admin" && !pathname.startsWith("/admin/");
}

export function PublicAppShell({
  children,
  structuredData,
}: {
  children: ReactNode;
  structuredData: string | null;
}) {
  const pathname = usePathname();

  if (!isPublicAppPath(pathname)) return children;

  return (
    <>
      {structuredData ? (
        <script
          dangerouslySetInnerHTML={{ __html: structuredData }}
          type="application/ld+json"
        />
      ) : null}
      <a className="skip-link" href="#main-content">
        跳到主要内容
      </a>
      <WechatContactProvider>
        <MiniProgramTrialProvider>
          <SiteHeader />
          <main className="public-site-main" id="main-content">
            {children}
          </main>
          <SiteFooter />
          <MobileContactBar />
          <Suspense fallback={null}>
            <AnalyticsPageView />
          </Suspense>
        </MiniProgramTrialProvider>
      </WechatContactProvider>
    </>
  );
}
