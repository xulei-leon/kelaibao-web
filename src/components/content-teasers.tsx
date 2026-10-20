import Link from "next/link";
import type { ContentType } from "@/content/article-types";
import { STATIC_CONTENT, articlePath } from "@/lib/static-content";

export function ContentTeasers({ contentType }: { contentType: ContentType }) {
  const items = STATIC_CONTENT.list(contentType).slice(0, 3);
  if (!items.length) return null;
  return <ul className="mt-6 grid gap-4">{items.map((item) => <li key={item.slug}>
    <Link className="context-link" href={articlePath(item)}>{item.title}</Link>
    <p>{item.summary}</p>
  </li>)}</ul>;
}
