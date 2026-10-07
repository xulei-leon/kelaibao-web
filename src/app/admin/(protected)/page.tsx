import Link from "next/link";

export default function AdminHomePage() {
  return (
    <section className="px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-4xl">
        <p className="text-sm uppercase tracking-[0.18em] text-black/55">
          Secure administration
        </p>
        <h1 className="mt-3 text-4xl font-semibold">客来宝内容安全后台</h1>
        <p className="mt-5 max-w-2xl text-black/70">
          使用服务端认证、CSRF、HTML 净化和不可变 revision
          管理新闻与案例。公开内容只有显式发布后才会变化。
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            className="inline-flex min-h-11 items-center rounded-md cta--product-primary px-5 text-white"
            href="/admin/news"
          >
            管理新闻
          </Link>
          <Link
            className="inline-flex min-h-11 items-center rounded-md border border-black px-5"
            href="/admin/cases"
          >
            管理案例
          </Link>
          <Link
            className="inline-flex min-h-11 items-center rounded-md border border-black px-5"
            href="/admin/preview"
          >
            HTML 安全预览
          </Link>
        </div>
      </div>
    </section>
  );
}
