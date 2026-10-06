"use client";

import { useState, type FormEvent } from "react";

export function AdminLoginForm() {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.get("username"),
          password: form.get("password"),
        }),
      });
      if (!response.ok) {
        setMessage("用户名或密码不正确，请稍后重试。");
        return;
      }
      window.location.assign("/admin");
    } catch {
      setMessage("登录服务暂不可用，请稍后重试。");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      className="mx-auto grid w-full max-w-md min-w-0 gap-5"
      onSubmit={submit}
    >
      <label className="grid min-w-0 gap-2">
        <span>管理员用户名</span>
        <input
          autoComplete="username"
          className="w-full min-w-0 rounded-md border border-black/20 bg-white px-4 py-3"
          name="username"
          required
          type="text"
        />
      </label>
      <label className="grid min-w-0 gap-2">
        <span>密码</span>
        <input
          autoComplete="current-password"
          className="w-full min-w-0 rounded-md border border-black/20 bg-white px-4 py-3"
          minLength={14}
          name="password"
          required
          type="password"
        />
      </label>
      <button
        className="w-full min-w-0 rounded-md bg-black px-5 py-3 text-white disabled:opacity-60"
        disabled={busy}
        type="submit"
      >
        {busy ? "正在验证…" : "登录"}
      </button>
      <p aria-live="polite" className="min-h-6 text-sm text-red-800">
        {message}
      </p>
    </form>
  );
}
