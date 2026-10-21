import type { Metadata } from "next";
import { PUBLIC_LIST_CONTENT } from "@/lib/public-list-content";
import { SITE_URL } from "@/lib/site-config";

export const PUBLIC_ROUTES = [
  "/",
  "/trial",
  "/features",
  "/team",
  "/media",
  "/media/packages",
  "/news",
  "/about",
  "/privacy",
  "/terms",
  "/disclaimer",
  "/results",
] as const;

export type PublicRoute = (typeof PUBLIC_ROUTES)[number];

interface RouteMetadataEntry {
  title: string;
  description: string;
  canonical: PublicRoute;
  keywords?: readonly string[];
}

export const ROUTE_METADATA: Record<PublicRoute, RouteMetadataEntry> = {
  "/trial": {
    title: "先免费试试，1分钟就知道好不好用。｜客来宝 K-Link",
    description: "打开发现页，挑一篇你愿意读的内容，先免费体验 K-Link，并比较免费试用与年费会员权益。",
    canonical: "/trial",
  },
  "/": {
    title: "你手机里有那么多微信群，有多少群友真正认识你？｜客来宝 K-Link",
    description: "客来宝 K-Link（klinktool.com）由小未来商务服务（深圳）有限公司技术运营，为带团队的经营者提供内容与工具服务：每天更新的内容库，转发时带上自己的数字名片，团队内容实时同步；以及人物专访、团队报道、活动发布等媒体发稿服务。系统坚守不采集隐私、不触碰团队、不干预业务三项中立原则，让每个人体面地持续被看见、被信任、被找到。",
    canonical: "/",
    keywords: [
      "微信社群获客",
      "团队内容同步",
      "数字名片",
      "团队小程序",
      "团队管理同步工具",
      "个人专访发稿",
      "新闻稿发布",
      "个人IP打造",
      "带团队的工具",
      "朋友圈内容素材",
      "陌生拓客",
      "直销获客",
      "获客工具",
    ],
  },
  "/features": {
    title: "会员服务｜每天有现成内容，转发就带上你。｜客来宝 K-Link",
    description: "客来宝年费会员599元/年：现成内容、数字名片、访客轨迹、团队小程序等九项权益。先免费试用，再决定。",
    canonical: "/features",
  },
  "/team": {
    title: "团队效率｜一个人会卖货，不代表整个团队都会。｜客来宝 K-Link",
    description: "团队长整理一次，队员一键取用统一内容，各自带自己的二维码。了解 K-Link 团队小程序的内容复制与成员分享归属。",
    canonical: "/team",
  },
  "/media": {
    title: "媒体服务｜发一篇，能用很久。｜客来宝媒体",
    description: "个人专访、团队报道、活动发布：从选题沟通、专业表达、撰稿审稿到协调发布，了解客来宝媒体服务与四档咨询套餐。",
    canonical: "/media",
  },
  "/media/packages": {
    title: "客来宝 K-Link 媒体套餐｜四套会员专享发稿方案",
    description: "了解客来宝 K-Link 面向个人 IP、团队招商、品牌项目与线下活动的四套会员专享媒体发稿方案、媒体组合和咨询价格。",
    canonical: "/media/packages",
  },
  "/news": {
    title: `${PUBLIC_LIST_CONTENT.news.title}｜客来宝`,
    description: PUBLIC_LIST_CONTENT.news.metadataDescription,
    canonical: "/news",
  },
  "/about": {
    title: "关于客来宝｜我们提供工具，连接由你决定。",
    description: "了解客来宝、K-Link 与客来宝媒体的工作原则、合作方式、适用情况与服务边界。",
    canonical: "/about",
  },
  "/privacy": {
    title: "隐私保护原则｜客来宝",
    description: "了解客来宝备用询盘表单收集的最小字段、处理目的、共享边界和待确认事项。",
    canonical: "/privacy",
  },
  "/terms": {
    title: "技术中立原则｜客来宝",
    description: "了解人工评估、定制范围、报价、站外合同与付款、第三方平台及客户责任。",
    canonical: "/terms",
  },
  "/disclaimer": {
    title: "用户行为规范｜客来宝",
    description: "了解客来宝关于真实表达、清晰合作、尊重授权与长期价值的合作原则。",
    canonical: "/disclaimer",
  },
  "/results": {
    title: "效果与责任说明｜客来宝",
    description: "了解客来宝数字化工具的效率价值、实际业务结果影响因素以及合理使用原则。",
    canonical: "/results",
  },
};

export function createPageMetadata(route: PublicRoute): Metadata {
  const item = ROUTE_METADATA[route];
  return {
    title: item.title,
    description: item.description,
    keywords: item.keywords ? [...item.keywords] : undefined,
    alternates: { canonical: item.canonical },
    openGraph: {
      type: "website",
      locale: "zh_CN",
      siteName: "客来宝",
      title: item.title,
      description: item.description,
      url: new URL(item.canonical, SITE_URL).toString(),
      images: [
        {
          url: "/opengraph-image",
          width: 1200,
          height: 630,
          alt: "客来宝｜K-Link 一站式拓客工具系统",
        },
      ],
    },
  };
}
