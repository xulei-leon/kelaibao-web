import type { Metadata } from "next";

import { AdminLoginForm } from "@/components/admin/login-form";

export const metadata: Metadata = {
  title: "管理员登录｜客来宝",
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLoginPage() {
  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-4 text-center text-3xl font-semibold">客来宝管理员登录</h1>
        <p className="mb-10 text-center text-black/65">
          仅供预创建的网站管理员使用，不提供公众注册或自助重置。
        </p>
        <AdminLoginForm />
      </div>
    </section>
  );
}
