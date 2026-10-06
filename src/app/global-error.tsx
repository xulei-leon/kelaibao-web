"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="zh-CN">
      <body>
        <main className="status-page" role="alert">
          <p className="eyebrow">客来宝站点暂时不可用</p>
          <h1>请稍后重新尝试</h1>
          <p>为保护信息，页面不会输出内部错误详情。</p>
          <button className="cta cta--navy-secondary" onClick={reset} type="button">重新加载</button>
        </main>
      </body>
    </html>
  );
}
