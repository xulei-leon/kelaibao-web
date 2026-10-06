import { NextResponse } from "next/server";
import type { MediaAsset } from "@/server/media/service";
import type { AdminMediaAsset } from "@/lib/admin/media-types";

export function mediaDisplayDto(asset: MediaAsset): AdminMediaAsset {
  const origin = new URL(process.env.OSS_ASSETS_BASE_URL ?? "");
  if (origin.protocol !== "https:" || origin.pathname !== "/" || origin.username || origin.password || origin.search || origin.hash || !asset.objectKey.startsWith("media/") || asset.objectKey.split("/").some(part => !part || part === "." || part === "..") || /[\\?#]/.test(asset.objectKey)) {
    throw new Error("Media assets origin unavailable.");
  }
  return {
    id: asset.id,
    publicUrl: `${origin.origin}/${asset.objectKey.split("/").map(encodeURIComponent).join("/")}`,
    mimeType: asset.mimeType,
    byteSize: asset.byteSize,
    width: asset.width,
    height: asset.height,
    publicUsageConfirmedAt: asset.publicUsageConfirmedAt?.toISOString() ?? null,
  };
}

export function mediaApiError(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (/administrator authentication required/i.test(message)) return { status: 401, code: "authentication_required", message: "登录已失效，请在新标签页登录后重新连接。", retryable: false };
  if (/csrf|trusted mutation|untrusted (host|origin)|request origin|request host|canonical origin/i.test(message)) return { status: 403, code: "request_rejected", message: "会话校验失败，请重新连接后重试。", retryable: false };
  if (/already in progress/i.test(message)) return { status: 409, code: "confirmation_in_progress", message: "图片仍在校验，请稍后重试确认。", retryable: true };
  if (/intent.*expired/i.test(message)) return { status: 422, code: "upload_expired", message: "上传已过期，请重新选择图片。", retryable: false };
  if (/not found|invalid media id/i.test(message)) return { status: 404, code: "media_not_found", message: "图片不存在或不可访问。", retryable: false };
  if (/^OSS_.*required|STS credentials|assets origin|endpoint|no valid lifetime/i.test(message)) return { status: 503, code: "media_unavailable", message: "图片存储暂不可用，请稍后再试。", retryable: false };
  if (/must|invalid|does not match|unsupported|outside|not allowed|mismatch|checksum|sha-256|magic|signature|polyglot|exceeds|forbidden|belongs to/i.test(message)) return { status: 422, code: "media_rejected", message: "图片校验未通过，请检查格式、大小后重新选择。", retryable: false };
  return { status: 503, code: "media_unavailable", message: "图片服务暂不可用，可稍后重试确认。", retryable: true };
}

export function mediaFailureResponse(error: unknown, requestId?: string) {
  const { status, ...failure } = mediaApiError(error);
  return NextResponse.json({ ok: false, ...failure, requestId }, {
    status,
    headers: { "Cache-Control": "private, no-store", ...(failure.code === "confirmation_in_progress" ? { "Retry-After": "2" } : {}) },
  });
}
