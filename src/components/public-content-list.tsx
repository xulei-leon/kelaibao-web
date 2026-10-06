import Link from "next/link";

import { PUBLIC_LIST_CONTENT } from "@/lib/public-list-content";
import type { ContentType } from "@/server/content/domain";
import type { PublicContentSnapshot } from "@/server/content/public-contract";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Shanghai",
  }).format(value);
}

export function PublicContentList({
  contentType,
  items,
}: {
  contentType: ContentType;
  items: PublicContentSnapshot[];
}) {
  const config = PUBLIC_LIST_CONTENT[contentType];
  return (
    <section
      className={`public-content-list public-content-list--${contentType} px-4 py-14 sm:px-6 sm:py-20`}
    >
      <div className="public-content-list__inner mx-auto max-w-5xl">
        <header className="public-content-list__header max-w-3xl">
          <p className="text-sm font-semibold tracking-[0.16em] text-[var(--champagne)]">
            {""}
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight sm:text-5xl">
            {config.title}
          </h1>
          {config.visibleDescription ? (
            <p className="mt-5 text-lg leading-8 text-[var(--muted)]">{config.visibleDescription}</p>
          ) : null}
        </header>

        {items.length ? (
          <div className="public-content-list__grid mt-12 grid gap-5">
            {items.map((item) => (
              <article
                className="public-content-card rounded border border-[var(--line)] bg-[var(--surface)] p-6 sm:p-8"
                key={`${item.contentType}:${item.id}`}
              >
                <p className="text-sm text-[var(--muted)]">
                  <time dateTime={item.firstPublishedAt.toISOString()}>
                    {formatDate(item.firstPublishedAt)}
                  </time>
                </p>
                <h2 className="mt-3 text-2xl font-semibold">
                  <Link
                    className="underline-offset-4 hover:underline focus-visible:underline"
                    href={`/${config.segment}/${item.slug}`}
                  >
                    {item.title}
                  </Link>
                </h2>
                <p className="mt-4 leading-8 text-[var(--muted)]">
                  {item.summary}
                </p>
                <Link
                  className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4"
                  href={`/${config.segment}/${item.slug}`}
                >
                  阅读{contentType === "news" ? "新闻" : "案例"}
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <p className="public-content-empty mt-12 rounded border border-[var(--line)] bg-[var(--surface)] p-8 leading-8 text-[var(--muted)]">
            {config.empty}
          </p>
        )}
      </div>
    </section>
  );
}
