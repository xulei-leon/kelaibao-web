import type { PublicContentSnapshot } from "@/server/content/public-contract";

const CMS_DISCOVERY_LIMIT = 100;

interface DiscoveryInput {
  siteUrl: string;
  contents: PublicContentSnapshot[];
}

interface SitemapInput extends DiscoveryInput {
  coreRoutes: readonly string[];
}

function xml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function canonicalUrl(siteUrl: string, path: string) {
  const url = new URL(path, siteUrl);
  url.search = "";
  url.hash = "";
  return url.toString();
}

function contentUrl(siteUrl: string, item: PublicContentSnapshot) {
  const segment = item.contentType === "news" ? "news" : "cases";
  return canonicalUrl(
    siteUrl,
    `/${segment}/${encodeURIComponent(item.slug)}`,
  );
}

function discoveryContents(contents: PublicContentSnapshot[]) {
  const seen = new Set<string>();
  return [...contents]
    .sort(
      (left, right) =>
        right.publishedAt.getTime() - left.publishedAt.getTime() ||
        right.contentItemId - left.contentItemId,
    )
    .filter((item) => {
      const key = `${item.contentType}:${item.slug}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, CMS_DISCOVERY_LIMIT);
}

export function buildSitemapXml({
  siteUrl,
  coreRoutes,
  contents,
}: SitemapInput) {
  const coreUrls = [...new Set(coreRoutes)].map((route) =>
    canonicalUrl(siteUrl, route),
  );
  const contentEntries = discoveryContents(contents).map((item) => ({
    url: contentUrl(siteUrl, item),
    lastModified: item.updatedAt.toISOString(),
  }));
  const urls = [
    ...coreUrls.map(
      (url) => `  <url><loc>${xml(url)}</loc></url>`,
    ),
    ...contentEntries.map(
      ({ url, lastModified }) =>
        `  <url><loc>${xml(url)}</loc><lastmod>${xml(lastModified)}</lastmod></url>`,
    ),
  ];
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    "</urlset>",
  ].join("\n");
}

export function buildRssXml({ siteUrl, contents }: DiscoveryInput) {
  const items = discoveryContents(contents).map((item) => {
    const url = contentUrl(siteUrl, item);
    return [
      "    <item>",
      `      <title>${xml(item.title)}</title>`,
      `      <description>${xml(item.summary)}</description>`,
      `      <link>${xml(url)}</link>`,
      `      <guid isPermaLink="true">${xml(url)}</guid>`,
      `      <pubDate>${item.firstPublishedAt.toUTCString()}</pubDate>`,
      "    </item>",
    ].join("\n");
  });
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0">',
    "  <channel>",
    "    <title>客来宝公开内容</title>",
    `    <link>${xml(canonicalUrl(siteUrl, "/"))}</link>`,
    "    <description>客来宝已发布的新闻与案例。</description>",
    "    <language>zh-cn</language>",
    ...items,
    "  </channel>",
    "</rss>",
  ].join("\n");
}

export function buildLlmsText({
  siteUrl,
  coreRoutes,
  contents,
}: SitemapInput) {
  const lines = [
    "# 客来宝",
    "",
    "> 实验性发现文件：仅列出当前公开、稳定且允许抓取的入口，不代表搜索排名、收录、推荐、AI 引用或流量保证。",
    "",
    "## 核心页面",
    "",
    ...[...new Set(coreRoutes)].map(
      (route) => `- ${canonicalUrl(siteUrl, route)}`,
    ),
    "",
    "## 已发布新闻与案例",
    "",
    ...discoveryContents(contents).map(
      (item) =>
        `- [${item.title.replace(/[\r\n\[\]]/g, " ")}](${contentUrl(siteUrl, item)}): ${item.summary.replace(/[\r\n]/g, " ")}`,
    ),
    "",
  ];
  return lines.join("\n");
}
