import type { ContentType } from "@/content/article-types";
import { STATIC_CONTENT } from "@/lib/static-content";
import { serializePublicContent } from "@/lib/content-pages";

export function staticListProps(contentType: ContentType) {
  return { props: { contentType, items: STATIC_CONTENT.list(contentType).map(serializePublicContent) } };
}

export function staticDetailPaths(contentType: ContentType) {
  return { paths: STATIC_CONTENT.list(contentType).map(({ slug }) => ({ params: { slug } })), fallback: false as const };
}

export function staticDetailProps(contentType: ContentType, slug: string | string[] | undefined) {
  const item = typeof slug === "string" ? STATIC_CONTENT.find(contentType, slug) : undefined;
  if (!item) return { notFound: true as const };
  return { props: { state: "published" as const, contentType, item: serializePublicContent(item) } };
}
