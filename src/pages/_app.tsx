import type { AppProps } from "next/app";
import Head from "next/head";

import "@/app/globals.css";
import "@/app/visual-refresh.css";
import "@/app/m4-03-visual-system.css";
import "@/app/operations-refresh.css";
import { MiniProgramTrialProvider } from "@/components/mini-program-trial";
import { MobileContactBar } from "@/components/mobile-contact-bar";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { WechatContactProvider } from "@/components/wechat-contact";

export default function PagesApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta content="width=device-width, initial-scale=1" name="viewport" />
        <meta content="#F5F8FC" name="theme-color" />
      </Head>
      <a className="skip-link" href="#main-content">
        跳到主要内容
      </a>
      <WechatContactProvider>
        <MiniProgramTrialProvider>
          <SiteHeader />
          <main className="public-site-main" id="main-content">
            <Component {...pageProps} />
          </main>
          <SiteFooter />
          <MobileContactBar />
        </MiniProgramTrialProvider>
      </WechatContactProvider>
    </>
  );
}
