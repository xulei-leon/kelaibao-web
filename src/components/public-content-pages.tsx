import Head from "next/head";

import { PublicContentList } from "@/components/public-content-list";
import {
  PublicContentDetail,
  deserializePublicContent,
  type PublicDetailPageProps,
  type PublicListPageProps,
} from "@/server/content/public-page";
import {
  buildPublicContentMetadata,
  buildPublicContentStructuredData,
  buildPublicListMetadata,
  buildPublicListStructuredData,
  safeSerializeJsonLd,
} from "@/server/discovery/metadata";
import { SITE_URL } from "@/lib/site-config";

interface PublicHeadMetadata {
  title: string;
  description: string;
  alternates: { canonical: string };
  openGraph: {
    type: string;
    title: string;
    description: string;
    url: string;
    siteName: string;
    locale: string;
    publishedTime?: string;
    modifiedTime?: string;
    images?: Array<{
      url: string;
      secureUrl?: string;
      width?: number;
      height?: number;
      alt?: string;
      type?: string;
    }>;
  };
  twitter?: {
    card?: string;
    title?: string;
    description?: string;
    images?: string[];
  };
}

function PublicHead({
  metadata,
  crawlEnabled,
  jsonLd,
}: {
  metadata: PublicHeadMetadata;
  crawlEnabled: boolean;
  jsonLd: string | null;
}) {
  return (
    <Head>
      <title>{metadata.title}</title>
      <meta content={metadata.description} name="description" />
      <link href={metadata.alternates.canonical} rel="canonical" />
      <meta
        content={
          crawlEnabled
            ? "index,follow"
            : "noindex,nofollow,noarchive,nosnippet"
        }
        name="robots"
      />
      <meta content={metadata.openGraph.type} property="og:type" />
      <meta content={metadata.openGraph.locale} property="og:locale" />
      <meta content={metadata.openGraph.siteName} property="og:site_name" />
      <meta content={metadata.openGraph.title} property="og:title" />
      <meta
        content={metadata.openGraph.description}
        property="og:description"
      />
      <meta content={metadata.openGraph.url} property="og:url" />
      {metadata.openGraph.images?.flatMap((image) => [
        <meta content={image.url} key={`${image.url}:url`} property="og:image" />,
        image.secureUrl ? (
          <meta content={image.secureUrl} key={`${image.url}:secure`} property="og:image:secure_url" />
        ) : null,
        image.width ? (
          <meta content={String(image.width)} key={`${image.url}:width`} property="og:image:width" />
        ) : null,
        image.height ? (
          <meta content={String(image.height)} key={`${image.url}:height`} property="og:image:height" />
        ) : null,
        image.alt ? (
          <meta content={image.alt} key={`${image.url}:alt`} property="og:image:alt" />
        ) : null,
        image.type ? (
          <meta content={image.type} key={`${image.url}:type`} property="og:image:type" />
        ) : null,
      ])}
      {metadata.twitter?.card ? (
        <meta content={metadata.twitter.card} name="twitter:card" />
      ) : null}
      {metadata.twitter?.title ? (
        <meta content={metadata.twitter.title} name="twitter:title" />
      ) : null}
      {metadata.twitter?.description ? (
        <meta content={metadata.twitter.description} name="twitter:description" />
      ) : null}
      {metadata.twitter?.images?.map((image) => (
        <meta content={image} key={image} name="twitter:image" />
      ))}
      {metadata.openGraph.publishedTime ? (
        <meta
          content={metadata.openGraph.publishedTime}
          property="article:published_time"
        />
      ) : null}
      {metadata.openGraph.modifiedTime ? (
        <meta
          content={metadata.openGraph.modifiedTime}
          property="article:modified_time"
        />
      ) : null}
      {jsonLd ? (
        <script
          dangerouslySetInnerHTML={{ __html: jsonLd }}
          type="application/ld+json"
        />
      ) : null}
    </Head>
  );
}

export function PublicDetailPage(props: PublicDetailPageProps) {
  if (props.state === "gone") {
    return (
      <>
        <Head>
          <title>内容已下线｜客来宝</title>
          <meta
            content="noindex,nofollow,noarchive,nosnippet"
            name="robots"
          />
        </Head>
        <PublicContentDetail {...props} />
      </>
    );
  }
  const item = deserializePublicContent(props.item);
  const metadata = buildPublicContentMetadata(
    item,
    SITE_URL,
    props.crawlEnabled,
  ) as PublicHeadMetadata;
  const jsonLd = safeSerializeJsonLd(() =>
    buildPublicContentStructuredData(item, SITE_URL),
  );
  return (
    <>
      <PublicHead
        crawlEnabled={props.crawlEnabled}
        jsonLd={jsonLd}
        metadata={metadata}
      />
      <PublicContentDetail {...props} />
    </>
  );
}

export function PublicListPage(props: PublicListPageProps) {
  const metadata = buildPublicListMetadata(
    props.contentType,
    SITE_URL,
    props.crawlEnabled,
  ) as PublicHeadMetadata;
  const jsonLd = safeSerializeJsonLd(() =>
    buildPublicListStructuredData(props.contentType, SITE_URL),
  );
  return (
    <>
      <PublicHead
        crawlEnabled={props.crawlEnabled}
        jsonLd={jsonLd}
        metadata={metadata}
      />
      <PublicContentList
        contentType={props.contentType}
        items={props.items.map(deserializePublicContent)}
      />
    </>
  );
}
