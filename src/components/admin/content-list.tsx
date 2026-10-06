"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type {
  ContentItemState,
  ContentType,
} from "@/server/content/domain";

const labels = {
  news: { singular: "新闻", plural: "新闻", route: "news" },
  case: { singular: "案例", plural: "案例", route: "cases" },
} as const;

export function ContentList({ contentType }: { contentType: ContentType }) {
  const [items, setItems] = useState<ContentItemState[]>([]);
  const [message, setMessage] = useState("正在读取内容…");
  const label = labels[contentType];

  useEffect(() => {
    let active = true;
    fetch(`/api/admin/content?type=${contentType}`, { cache: "no-store" })
      .then(async (response) => {
        const result = (await response.json()) as {
          items?: ContentItemState[];
          message?: string;
        };
        if (!response.ok || !result.items) {
          throw new Error(result.message ?? "load");
        }
        if (active) {
          setItems(result.items);
          setMessage(result.items.length ? "" : `尚未创建${label.plural}。`);
        }
      })
      .catch(() => {
        if (active) setMessage("内容列表暂不可用，请稍后重试。");
      });
    return () => {
      active = false;
    };
  }, [contentType, label.plural]);

  return (
    <section className="px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-black/55">
              Content administration
            </p>
            <h1 className="mt-2 text-3xl font-semibold">{label.plural}管理</h1>
          </div>
          <Link
            className="inline-flex min-h-11 items-center rounded-md bg-black px-5 py-2 text-white"
            href={`/admin/${label.route}/new`}
          >
            新建{label.singular}
          </Link>
        </div>

        <p aria-live="polite" className="mt-8 min-h-6 text-sm text-black/65">
          {message}
        </p>
        {items.length ? (
          <div className="mt-4 overflow-x-auto rounded-md border border-black/15 bg-white">
            <table className="w-full min-w-[680px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-black/15 bg-black/[0.03]">
                  <th className="px-4 py-3">标题</th>
                  <th className="px-4 py-3">公开状态</th>
                  <th className="px-4 py-3">版本</th>
                  <th className="px-4 py-3">草稿 / 公开 revision</th>
                  <th className="px-4 py-3">操作</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr className="border-b border-black/10" key={item.id}>
                    <td className="max-w-sm px-4 py-4">
                      <strong className="block break-words">{item.title}</strong>
                      <span className="break-all text-xs text-black/55">
                        {item.slug}
                      </span>
                    </td>
                    <td className="px-4 py-4">{item.publicStatus}</td>
                    <td className="px-4 py-4">{item.version}</td>
                    <td className="px-4 py-4">
                      {item.draftRevisionId ?? "—"} /{" "}
                      {item.publishedRevisionId ?? "—"}
                    </td>
                    <td className="px-4 py-4">
                      <Link
                        className="underline underline-offset-4"
                        href={`/admin/${label.route}/${item.id}`}
                      >
                        编辑
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </section>
  );
}
