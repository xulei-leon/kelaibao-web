import type { Metadata } from "next";

import {
  ROUTE_METADATA,
  type PublicRoute,
} from "@/lib/route-metadata";
import { PUBLIC_LIST_CONTENT } from "@/lib/public-list-content";
import type { ContentType } from "@/content/article-types";
import type { PublicArticle } from "@/content/article-types";

const ORGANIZATION_NAME = "客来宝";
export type StructuredDataNode = Record<string, unknown> & {
  "@context": "https://schema.org";
  "@type": string;
};

function contentPath(item: PublicArticle) {
  const segment = item.contentType === "news" ? "news" : "cases";
  return `/${segment}/${encodeURIComponent(item.slug)}`;
}

function absoluteUrl(siteUrl: string, path: string) {
  return new URL(path, siteUrl).toString();
}

export function buildPublicContentMetadata(
  item: PublicArticle,
  siteUrl: string,
  crawlEnabled: boolean,
): Metadata {
  const title = `${item.title}｜${ORGANIZATION_NAME}`;
  const canonical = absoluteUrl(siteUrl, contentPath(item));
  const socialImage = item.coverImage ?? {
    url: absoluteUrl(siteUrl, "/opengraph-image"),
    width: 1200,
    height: 630,
    alt: "客来宝｜K-Link 一站式拓客工具系统",
    mimeType: "image/png" as const,
  };
  const images = [
    {
      url: absoluteUrl(siteUrl, socialImage.url),
      secureUrl: absoluteUrl(siteUrl, socialImage.url),
      width: socialImage.width,
      height: socialImage.height,
      alt: socialImage.alt,
      type: socialImage.mimeType,
    },
  ];
  return {
    title,
    description: item.summary,
    alternates: { canonical },
    robots: crawlEnabled
      ? { index: true, follow: true }
      : { index: false, follow: false, nocache: true },
    openGraph: {
      type: "article",
      locale: "zh_CN",
      siteName: ORGANIZATION_NAME,
      title,
      description: item.summary,
      url: canonical,
      publishedTime: item.firstPublishedAt.toISOString(),
      modifiedTime: item.updatedAt.toISOString(),
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: item.summary,
      images: [absoluteUrl(siteUrl, socialImage.url)],
    },
  };
}

export function buildPublicListMetadata(
  contentType: ContentType,
  siteUrl: string,
  crawlEnabled: boolean,
): Metadata {
  const config = PUBLIC_LIST_CONTENT[contentType];
  const title = `${config.title}｜${ORGANIZATION_NAME}`;
  const canonical = absoluteUrl(siteUrl, config.path);
  return {
    title,
    description: config.metadataDescription,
    alternates: { canonical },
    robots: crawlEnabled
      ? { index: true, follow: true }
      : { index: false, follow: false, nocache: true },
    openGraph: {
      type: "website",
      locale: "zh_CN",
      siteName: ORGANIZATION_NAME,
      title,
      description: config.metadataDescription,
      url: canonical,
    },
  };
}

export function buildGlobalStructuredData(siteUrl: string): StructuredDataNode[] {
  const organizationId = absoluteUrl(siteUrl, "/#organization");
  const websiteId = absoluteUrl(siteUrl, "/#website");
  return [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": organizationId,
      name: ORGANIZATION_NAME,
      url: absoluteUrl(siteUrl, "/"),
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": websiteId,
      name: ORGANIZATION_NAME,
      url: absoluteUrl(siteUrl, "/"),
      publisher: { "@id": organizationId },
      inLanguage: "zh-CN",
    },
  ];
}

export function buildStaticPageStructuredData(
  route: PublicRoute,
  siteUrl: string,
): StructuredDataNode[] {
  const metadata = ROUTE_METADATA[route];
  const canonical = absoluteUrl(siteUrl, metadata.canonical);
  const webPageId = `${canonical.replace(/\/$/, route === "/" ? "/" : "")}#webpage`;
  const websiteId = absoluteUrl(siteUrl, "/#website");
  const organizationId = absoluteUrl(siteUrl, "/#organization");
  const pageType = route === "/about" ? "AboutPage" : "WebPage";
  const page: StructuredDataNode = {
    "@context": "https://schema.org",
    "@type": pageType,
    "@id": webPageId,
    url: canonical,
    name: metadata.title,
    description: metadata.description,
    isPartOf: { "@id": websiteId },
    publisher: { "@id": organizationId },
    inLanguage: "zh-CN",
  };

  if (route !== "/media") return [page];

  const serviceId = `${canonical.replace(/\/$/, "")}#service`;
  page.mainEntity = { "@id": serviceId };
  return [
    page,
    {
      "@context": "https://schema.org",
      "@type": "Service",
      "@id": serviceId,
      name: "客来宝媒体",
      description: metadata.description,
      url: canonical,
      provider: { "@id": organizationId },
      areaServed: "CN",
      inLanguage: "zh-CN",
    },
  ];
}

export function buildPublicListStructuredData(
  contentType: ContentType,
  siteUrl: string,
): StructuredDataNode[] {
  const config = PUBLIC_LIST_CONTENT[contentType];
  return [
    ...buildGlobalStructuredData(siteUrl),
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "首页",
          item: absoluteUrl(siteUrl, "/"),
        },
        {
          "@type": "ListItem",
          position: 2,
          name: config.title,
          item: absoluteUrl(siteUrl, config.path),
        },
      ],
    },
  ];
}

export function buildPublicContentStructuredData(
  item: PublicArticle,
  siteUrl: string,
): StructuredDataNode[] {
  const organizationId = absoluteUrl(siteUrl, "/#organization");
  const canonical = absoluteUrl(siteUrl, contentPath(item));
  const listUrl = absoluteUrl(
    siteUrl,
    item.contentType === "news" ? "/news" : "/cases",
  );
  const label = item.contentType === "news" ? "新闻" : "案例";
  return [
    ...buildGlobalStructuredData(siteUrl),
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "首页",
          item: absoluteUrl(siteUrl, "/"),
        },
        {
          "@type": "ListItem",
          position: 2,
          name: label,
          item: listUrl,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: item.title,
          item: canonical,
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": item.contentType === "news" ? "NewsArticle" : "Article",
      headline: item.title,
      description: item.summary,
      datePublished: item.firstPublishedAt.toISOString(),
      dateModified: item.updatedAt.toISOString(),
      mainEntityOfPage: canonical,
      url: canonical,
      author: { "@id": organizationId },
      publisher: { "@id": organizationId },
      inLanguage: "zh-CN",
      ...(item.coverImage
        ? {
            image: {
              "@type": "ImageObject",
              "@id": `${absoluteUrl(siteUrl, item.coverImage.url)}#imageobject`,
              url: absoluteUrl(siteUrl, item.coverImage.url),
              contentUrl: absoluteUrl(siteUrl, item.coverImage.url),
              width: item.coverImage.width,
              height: item.coverImage.height,
              encodingFormat: item.coverImage.mimeType,
            },
          }
        : {}),
    },
  ];
}

function serializeJsonLd(value: unknown) {
  const serialized = JSON.stringify(value);
  if (serialized === undefined) {
    throw new Error("jsonld_serialization_failed");
  }
  return serialized
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

export function safeSerializeJsonLd(
  factory: () => unknown,
  warn: (message: string) => void = console.warn,
) {
  try {
    return serializeJsonLd(factory());
  } catch {
    warn(
      "public_jsonld_failed component=structured_data reason=serialization_failed",
    );
    return null;
  }
}
