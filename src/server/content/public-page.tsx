import type { ContentType } from "@/server/content/domain";
import type { PublicContentSnapshot } from "@/server/content/public-contract";

export const PUBLIC_CACHE_CONTROL =
  "public, s-maxage=60, must-revalidate";
export const PRIVATE_NO_STORE = "private, no-store, max-age=0";

export type SerializedPublicContentSnapshot = Omit<
  PublicContentSnapshot,
  "firstPublishedAt" | "publishedAt" | "updatedAt"
> & {
  firstPublishedAt: string;
  publishedAt: string;
  updatedAt: string;
};

export type PublicDetailPageProps =
  | {
      state: "published";
      contentType: ContentType;
      crawlEnabled: boolean;
      item: SerializedPublicContentSnapshot;
    }
  | {
      state: "gone";
      contentType: ContentType;
      slug: string;
    };

export interface PublicListPageProps {
  contentType: ContentType;
  crawlEnabled: boolean;
  items: SerializedPublicContentSnapshot[];
}

export function serializePublicContent(
  item: PublicContentSnapshot,
): SerializedPublicContentSnapshot {
  return {
    ...item,
    firstPublishedAt: item.firstPublishedAt.toISOString(),
    publishedAt: item.publishedAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

export function deserializePublicContent(
  item: SerializedPublicContentSnapshot,
): PublicContentSnapshot {
  return {
    ...item,
    firstPublishedAt: new Date(item.firstPublishedAt),
    publishedAt: new Date(item.publishedAt),
    updatedAt: new Date(item.updatedAt),
  };
}

const labels = {
  news: { singular: "新闻", plural: "新闻", href: "/news" },
  case: { singular: "案例", plural: "案例", href: "/cases" },
} as const;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Shanghai",
  }).format(new Date(value));
}

export function PublicContentDetail(props: PublicDetailPageProps) {
  const label = labels[props.contentType];
  if (props.state === "gone") {
    return (
      <section
        className={`public-content-detail public-content-detail--${props.contentType} public-content-detail--gone px-4 py-16 sm:px-6 sm:py-24`}
      >
        <div className="mx-auto max-w-3xl">
          <nav aria-label="面包屑" className="text-sm text-[var(--muted)]">
            <a className="underline underline-offset-4" href="/">
              首页
            </a>
            <span aria-hidden="true"> / </span>
            <a className="underline underline-offset-4" href={label.href}>
              {label.plural}
            </a>
          </nav>
          <h1 className="mt-6 text-4xl font-semibold">
            该{label.singular}已下线
          </h1>
          <p className="mt-5 leading-8 text-[var(--muted)]">
            此内容不再公开。你可以返回{label.plural}列表查看当前可访问内容。
          </p>
          <a
            className="mt-8 inline-flex min-h-11 items-center underline underline-offset-4"
            href={label.href}
          >
            返回{label.plural}列表
          </a>
        </div>
      </section>
    );
  }

  return (
    <article
      className={`public-content-detail public-content-detail--${props.contentType} px-4 py-14 sm:px-6 sm:py-20`}
    >
      <div className="mx-auto max-w-3xl">
        <nav aria-label="面包屑" className="text-sm text-[var(--muted)]">
          <a className="underline underline-offset-4" href="/">
            首页
          </a>
          <span aria-hidden="true"> / </span>
          <a className="underline underline-offset-4" href={label.href}>
            {label.plural}
          </a>
          <span aria-hidden="true"> / </span>
          <span aria-current="page">{props.item.title}</span>
        </nav>
        <header className="mt-8 border-b border-[var(--line)] pb-8">
          <p className="text-sm font-semibold tracking-[0.16em] text-[var(--champagne)]">
            {label.singular}
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight sm:text-5xl">
            {props.item.title}
          </h1>
          <p className="mt-5 text-lg leading-8 text-[var(--muted)]">
            {props.item.summary}
          </p>
          <dl className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-[var(--muted)]">
            <div className="flex gap-2">
              <dt>发布方</dt>
              <dd>客来宝</dd>
            </div>
            <div className="flex gap-2">
              <dt>首次发布</dt>
              <dd>
                <time dateTime={props.item.firstPublishedAt}>
                  {formatDate(props.item.firstPublishedAt)}
                </time>
              </dd>
            </div>
            <div className="flex gap-2">
              <dt>更新</dt>
              <dd>
                <time dateTime={props.item.updatedAt}>
                  {formatDate(props.item.updatedAt)}
                </time>
              </dd>
            </div>
          </dl>
        </header>
        {props.item.coverImage ? (
          <img
            alt={props.item.coverImage.alt}
            className="mt-8 h-auto w-full rounded-[var(--radius-lg)] object-cover"
            decoding="async"
            fetchPriority="high"
            height={props.item.coverImage.height}
            loading="eager"
            src={props.item.coverImage.url}
            width={props.item.coverImage.width}
          />
        ) : null}
        <div
          className="content-rich mt-10"
          dangerouslySetInnerHTML={{ __html: props.item.sanitizedHtml }}
        />
      </div>
    </article>
  );
}
