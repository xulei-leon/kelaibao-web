"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

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
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const deleting = useRef(false);

  async function removeNews(item: ContentItemState) {
    if (contentType !== "news" || deleting.current) return;
    if (!window.confirm(`确定删除新闻“${item.title}”？删除后将从管理列表移除，已发布内容也会下线。此操作无法在后台撤销。`)) return;
    deleting.current = true;
    setDeletingId(item.id);
    setMessage("");
    try {
      const session = await fetch("/api/admin/auth/session", {
        cache: "no-store", signal: AbortSignal.timeout(15000),
      });
      const credentials = await session.json() as { csrfToken?: string };
      if (!session.ok || !credentials.csrfToken) throw new Error("登录已失效，请重新登录后再删除。");
      const response = await fetch(`/api/admin/content/${item.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": credentials.csrfToken },
        body: JSON.stringify({ expectedVersion: item.version }),
        signal: AbortSignal.timeout(30000),
      });
      const result = await response.json() as { ok?: boolean; code?: string };
      if (!response.ok || !result.ok) {
        if (result.code === "version_conflict") throw new Error("新闻已被修改，请刷新列表后再删除。");
        if (response.status === 401 || response.status === 403) throw new Error("会话校验失败，请重新登录后再删除。");
        if (response.status === 404) throw new Error("新闻已不存在，请刷新列表。");
        throw new Error("删除失败，请稍后重试。新闻列表已保留。");
      }
      setItems(current => current.filter(currentItem => currentItem.id !== item.id));
      setMessage("新闻已删除。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "删除失败，请稍后重试。新闻列表已保留。");
    } finally {
      deleting.current = false;
      setDeletingId(null);
    }
  }

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
            className="inline-flex min-h-11 items-center rounded-md cta--product-primary px-5 py-2 text-white"
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
                      <div className="flex items-center gap-4 whitespace-nowrap">
                      <Link
                        className="underline underline-offset-4"
                        href={`/admin/${label.route}/${item.id}`}
                      >
                        编辑
                      </Link>
                      {contentType === "news" ? <button
                        type="button"
                        aria-label={`删除新闻：${item.title}`}
                        disabled={deletingId !== null}
                        onClick={() => void removeNews(item)}
                        className="min-h-11 text-red-800 underline underline-offset-4 disabled:opacity-50"
                      >
                        {deletingId === item.id ? "删除中…" : "删除"}
                      </button> : null}
                      </div>
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
