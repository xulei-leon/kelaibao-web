import { HtmlPreviewWorkbench } from "@/components/admin/html-preview-workbench";

export default function AdminPreviewPage() {
  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-semibold">HTML 安全预览</h1>
        <p className="mb-8 mt-3 max-w-3xl text-black/65">
          预览只显示当前 sanitizer policy 的结果，并使用无脚本、无同源权限的
          sandbox 与 restrictive CSP。
        </p>
        <HtmlPreviewWorkbench />
      </div>
    </section>
  );
}
