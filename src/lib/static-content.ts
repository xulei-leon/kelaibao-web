import { ARTICLES, CONTENT_REDIRECTS, WITHDRAWN_CONTENT } from "@/content/articles";
import type { ArticleImage, ArticleSource, ContentRedirect, ContentType, PublicArticle } from "@/content/article-types";

const ARTICLE_PATH = /^\/(news|cases)\/[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function nonempty(value: string, field: string) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`Invalid article ${field}.`);
}

function date(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) {
    throw new Error("Article dates require an explicit ISO timezone.");
  }
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) throw new Error("Invalid article date.");
  // Reject calendar overflow (e.g. February 30) before timezone conversion.
  const calendar = new Date(value.slice(0, 19) + "Z");
  if (calendar.toISOString().slice(0, 19) !== value.slice(0, 19)) throw new Error("Invalid article date.");
  return parsed;
}

function image(value: ArticleImage) {
  nonempty(value.alt, "image alt");
  if (!Number.isSafeInteger(value.width) || value.width < 1 || !Number.isSafeInteger(value.height) || value.height < 1) {
    throw new Error("Invalid article image dimensions.");
  }
  if (!["image/jpeg", "image/png", "image/webp"].includes(value.mimeType)) throw new Error("Invalid article image type.");
  const url = new URL(value.url, "https://local.invalid");
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash || value.url.startsWith("//") || value.url.includes("\\") || (!value.url.startsWith("/") && !value.url.startsWith("https://"))) {
    throw new Error("Article images require a stable local path or HTTPS URL.");
  }
}

export function articlePath(item: Pick<ArticleSource, "contentType" | "slug">) {
  return `/${item.contentType === "news" ? "news" : "cases"}/${item.slug}`;
}

export function createStaticCatalogue(
  sources: readonly ArticleSource[],
  withdrawn: readonly string[] = [],
  redirects: readonly ContentRedirect[] = [],
) {
  const publicPaths = new Set<string>();
  const articles: PublicArticle[] = sources.map((source) => {
    if (!["news", "case"].includes(source.contentType) || !SLUG.test(source.slug) || source.slug.length > 191) throw new Error("Invalid article type or slug.");
    nonempty(source.title, "title");
    nonempty(source.summary, "summary");
    const path = articlePath(source);
    if (publicPaths.has(path)) throw new Error(`Duplicate article path: ${path}`);
    publicPaths.add(path);
    const firstPublishedAt = date(source.firstPublishedAt);
    const publishedAt = date(source.publishedAt);
    const updatedAt = date(source.updatedAt);
    if (publishedAt < firstPublishedAt || updatedAt < firstPublishedAt) throw new Error("Article dates precede first publication.");
    if (source.contentType === "case" && !source.authorizationReviewedAt) throw new Error("Case authorization review is required.");
    if (source.authorizationReviewedAt) date(source.authorizationReviewedAt);
    if (!source.body.length) throw new Error("Article body is required.");
    for (const block of source.body) {
      if (block.type === "image") image(block.image);
      else if (block.type === "list") {
        if (!block.items.length) throw new Error("Article list is empty.");
        block.items.forEach((text) => nonempty(text, "list item"));
      } else if (["paragraph", "heading", "quote"].includes(block.type) && "text" in block) nonempty(block.text, "body text");
      else throw new Error("Unsupported article block.");
    }
    if (source.coverImage) image(source.coverImage);
    // Only public fields enter page props. Never put private evidence in this module.
    return { contentType: source.contentType, slug: source.slug, title: source.title, summary: source.summary,
      firstPublishedAt, publishedAt, updatedAt, body: source.body, coverImage: source.coverImage };
  });
  const retired = new Set<string>();
  const moved = new Map<string, string>();
  for (const path of withdrawn) {
    if (!ARTICLE_PATH.test(path) || publicPaths.has(path) || retired.has(path)) throw new Error("Invalid or overlapping withdrawn path.");
    retired.add(path);
  }
  for (const entry of redirects) {
    if (!ARTICLE_PATH.test(entry.from) || !publicPaths.has(entry.to) || publicPaths.has(entry.from) || retired.has(entry.from) || moved.has(entry.from)) {
      throw new Error("Invalid or overlapping content redirect.");
    }
    moved.set(entry.from, entry.to);
  }
  articles.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime() || articlePath(a).localeCompare(articlePath(b), "en"));
  return {
    articles,
    list: (type: ContentType) => articles.filter((item) => item.contentType === type),
    find: (type: ContentType, slug: string) => articles.find((item) => item.contentType === type && item.slug === slug),
    disposition: (path: string) => retired.has(path) ? { status: 410 as const } : moved.has(path) ? { status: 308 as const, to: moved.get(path)! } : null,
  };
}

// Imported by every public list/detail/discovery build; invalid content fails the build.
export const STATIC_CONTENT = createStaticCatalogue(ARTICLES, WITHDRAWN_CONTENT, CONTENT_REDIRECTS);
