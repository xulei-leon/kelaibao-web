import { NextResponse, type NextRequest } from "next/server";
import { CONTENT_REDIRECTS, WITHDRAWN_CONTENT } from "@/content/articles";

// Keep article bodies and content validation out of the Edge middleware.
// Catalogue overlaps and destinations are validated by the static page build.
const withdrawn = new Set(WITHDRAWN_CONTENT);
const redirects = new Map(CONTENT_REDIRECTS.map(({ from, to }) => [from, to]));

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname.replace(/\/$/, "");
  const result = withdrawn.has(path) ? { status: 410 as const } : redirects.has(path) ? { status: 308 as const, to: redirects.get(path)! } : null;
  if (!result) return NextResponse.next();
  if (result.status === 308) return NextResponse.redirect(new URL(result.to, request.url), 308);
  const isNews = path.startsWith("/news/");
  const label = isNews ? "新闻" : "案例";
  const back = isNews ? "/news" : "/cases";
  return new NextResponse(`<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>内容已下线｜客来宝</title></head><body style="margin:0;background:#f5f8fc;color:#132b4d;font-family:system-ui,sans-serif"><main style="max-width:48rem;margin:4rem auto;padding:1.5rem"><a href="/">首页</a><h1>该${label}已下线</h1><p>此内容不再公开。</p><a href="${back}">返回${label}列表</a></main></body></html>`, {
    status: 410,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "private, no-store, max-age=0", "X-Robots-Tag": "noindex, nofollow", "X-Content-Type-Options": "nosniff" },
  });
}

export const config = { matcher: ["/news/:path*", "/cases/:path*"] };
