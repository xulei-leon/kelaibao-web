"use client";

import { useState, type FormEvent } from "react";

import { SafeHtmlPreview } from "@/components/admin/safe-html-preview";

export function HtmlPreviewWorkbench() {
  const [source, setSource] = useState("<h2>预览标题</h2><p>安全正文</p>");
  const [sanitized, setSanitized] = useState("");
  const [message, setMessage] = useState("");

  async function preview(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    try {
      const sessionResponse = await fetch("/api/admin/auth/session", {
        cache: "no-store",
      });
      const session = (await sessionResponse.json()) as {
        csrfToken?: string;
      };
      if (!sessionResponse.ok || !session.csrfToken) {
        throw new Error("session");
      }
      const response = await fetch("/api/admin/security/sanitize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": session.csrfToken,
        },
        body: JSON.stringify({ source }),
      });
      const result = (await response.json()) as {
        html?: string;
        diagnostics?: { changed: boolean };
      };
      if (!response.ok || typeof result.html !== "string") {
        throw new Error("sanitize");
      }
      setSanitized(result.html);
      setMessage(
        result.diagnostics?.changed
          ? "预览已移除不允许的内容。"
          : "预览内容符合当前安全策略。",
      );
    } catch {
      setMessage("安全预览暂不可用。");
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <form className="grid gap-4" onSubmit={preview}>
        <label className="grid gap-2">
          <span>HTML source</span>
          <textarea
            className="min-h-80 rounded-md border border-black/20 bg-white p-4 font-mono text-sm"
            onChange={(event) => setSource(event.target.value)}
            value={source}
          />
        </label>
        <button
          className="rounded-md bg-black px-5 py-3 text-white"
          type="submit"
        >
          生成安全预览
        </button>
        <p aria-live="polite" className="min-h-6 text-sm text-black/65">
          {message}
        </p>
      </form>
      <div>
        <h2 className="mb-3 text-xl font-semibold">Sandbox 预览</h2>
        {sanitized ? (
          <SafeHtmlPreview html={sanitized} />
        ) : (
          <p className="text-black/60">提交后显示当前 policy 的净化结果。</p>
        )}
      </div>
    </div>
  );
}
