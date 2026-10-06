import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import "./visual-refresh.css";
import "./m4-03-visual-system.css";
import { PublicAppShell } from "@/components/public-app-shell";
import { BRAND } from "@/lib/site-content";
import { SITE_URL } from "@/lib/site-config";
import { isPublicCrawlEnabled } from "@/server/discovery/config";
import {
  buildGlobalStructuredData,
  safeSerializeJsonLd,
} from "@/server/discovery/metadata";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#F5F8FC",
  colorScheme: "light",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "客来宝｜K-Link 一站式拓客工具系统与客来宝媒体",
    template: "%s",
  },
  description: BRAND.promise,
  applicationName: BRAND.name,
  robots: isPublicCrawlEnabled()
    ? { index: true, follow: true }
    : { index: false, follow: false, nocache: true },
};

const globalJsonLd = safeSerializeJsonLd(() =>
  buildGlobalStructuredData(SITE_URL),
);

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN" data-scroll-behavior="smooth">
      <body>
        <PublicAppShell structuredData={globalJsonLd}>
          {children}
        </PublicAppShell>
      </body>
    </html>
  );
}
