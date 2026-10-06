import type { AdminMediaAsset } from "./media-types";

export class MediaUploadError extends Error {
  constructor(message: string, public readonly retryable = false, public readonly intentId?: string, public readonly retryAfterMs = 0) { super(message); }
}

type Options = {
  csrf: () => Promise<string>;
  onStage?: (stage: string) => void;
  onIntent?: (intentId: string | null) => void;
  fetcher?: typeof fetch;
  digest?: (bytes: ArrayBuffer) => Promise<ArrayBuffer>;
  delay?: (ms: number) => Promise<void>;
};

export function validateImageFile(file: File) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new MediaUploadError("只支持 JPEG、PNG、WebP 图片。");
  if (!file.size || file.size > 10 * 1024 * 1024) throw new MediaUploadError("请选择不超过 10 MB 的图片。");
}

// Deadlines cover both the HTTP response and its JSON body.
export async function mediaJson(url: string, init: RequestInit, timeout = 15000, fetcher: typeof fetch = fetch) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetcher(url, { ...init, credentials: "same-origin", cache: "no-store", signal: controller.signal });
    const body = await response.json();
    if (!response.ok || body.ok === false) {
      if (response.status === 401 || response.status === 403) throw new MediaUploadError("会话失效，请在新标签页登录后重新连接。", false);
      if (body.code === "confirmation_in_progress") {
        const retryAfter = response.headers.get("Retry-After") ?? "2";
        const seconds = /^\d+$/.test(retryAfter) ? Number(retryAfter) : (Date.parse(retryAfter) - Date.now()) / 1000;
        throw new MediaUploadError("图片仍在校验，请稍后重试确认。", true, undefined, Math.min(30000, Math.max(2000, Number.isFinite(seconds) ? seconds * 1000 : 2000)));
      }
      throw new MediaUploadError(body.retryable ? "图片服务暂不可用，可重试确认。" : "图片操作未通过校验，请检查文件或稍后重试。", body.retryable === true);
    }
    return body;
  } catch (error) {
    if (error instanceof MediaUploadError) throw error;
    throw new MediaUploadError("连接失败或超时，请稍后重试。", true);
  } finally {
    clearTimeout(timer);
  }
}

export function confirmedAsset(value: unknown): AdminMediaAsset {
  const asset = value as AdminMediaAsset | undefined;
  if (!asset || !Number.isSafeInteger(asset.id) || asset.id < 1 || !Number.isSafeInteger(asset.width) || asset.width <= 0 || !Number.isSafeInteger(asset.height) || asset.height <= 0 || !Number.isSafeInteger(asset.byteSize) || asset.byteSize <= 0 || asset.byteSize > 10 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp"].includes(asset.mimeType)) throw new MediaUploadError("图片确认响应不完整，请重试确认。", true);
  const url = new URL(asset.publicUrl);
  if (url.protocol !== "https:" || !url.pathname.startsWith("/media/") || url.search || url.hash || url.username || url.password) throw new MediaUploadError("图片地址无效，请重试确认。", true);
  return { id: asset.id, publicUrl: url.href, mimeType: asset.mimeType, byteSize: asset.byteSize, width: asset.width, height: asset.height, publicUsageConfirmedAt: asset.publicUsageConfirmedAt ?? null };
}

export async function confirmUploadedImage(intentId: string, options: Options): Promise<AdminMediaAsset> {
  const delay = options.delay ?? ((ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms)));
  for (let attempt = 0; attempt < 3; attempt++) {
    options.onStage?.("正在校验图片…");
    try {
      const result = await mediaJson("/api/admin/media/confirm", {
        method: "POST", headers: { "Content-Type": "application/json", "X-CSRF-Token": await options.csrf() }, body: JSON.stringify({ intentId }),
      }, 30000, options.fetcher);
      return confirmedAsset(result.asset);
    } catch (error) {
      const failure = error instanceof MediaUploadError ? error : new MediaUploadError("确认失败，请重新连接会话后重试确认。");
      if (!failure.retryable || attempt === 2) throw new MediaUploadError(failure.message, failure.retryable, intentId);
      await delay(Math.max((attempt + 1) * 1000, failure.retryAfterMs));
    }
  }
  throw new MediaUploadError("请重试确认。", true, intentId);
}

export async function uploadImage(file: File, options: Options): Promise<AdminMediaAsset> {
  validateImageFile(file);
  options.onIntent?.(null);
  options.onStage?.("正在读取图片…");
  const bytes = await file.arrayBuffer();
  const digest = await (options.digest?.(bytes) ?? crypto.subtle.digest("SHA-256", bytes));
  const sha256 = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
  options.onStage?.("正在申请上传…");
  const signed = await mediaJson("/api/admin/media/presign", {
    method: "POST", headers: { "Content-Type": "application/json", "X-CSRF-Token": await options.csrf() },
    body: JSON.stringify({ fileName: file.name, mimeType: file.type, byteSize: file.size, sha256 }),
  }, 15000, options.fetcher);
  const auth = signed.authorization;
  const url = new URL(auth?.url);
  if (url.protocol !== "https:" || url.username || url.password || auth.method !== "PUT" || typeof signed.intentId !== "string" || new Date(auth.expiresAt).getTime() <= Date.now()) throw new MediaUploadError("上传授权无效，请重新选择图片。");
  options.onStage?.("正在上传图片…");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60000);
  try {
    const result = await (options.fetcher ?? fetch)(auth.url, { method: "PUT", headers: auth.headers, body: file, credentials: "omit", redirect: "error", referrerPolicy: "no-referrer", signal: controller.signal });
    if (!result.ok) throw new Error("upload_failed");
  } catch {
    // A lost PUT response may still mean OSS accepted the file. Preserve the intent.
    options.onIntent?.(signed.intentId);
    throw new MediaUploadError("上传响应未确认，请重试确认；若文件不存在，再重新选择上传。", true, signed.intentId);
  } finally { clearTimeout(timer); }
  options.onIntent?.(signed.intentId);
  const asset = await confirmUploadedImage(signed.intentId, options);
  options.onIntent?.(null);
  return asset;
}

export async function imageDimensions(file: File): Promise<{ width: number; height: number }> {
  const url = URL.createObjectURL(file);
  try {
    return await new Promise((resolve, reject) => {
      const image = new Image();
      const timer = setTimeout(() => { image.src = ""; reject(new Error("图片读取超时，请重新选择。")); }, 10000);
      image.onload = () => { clearTimeout(timer); resolve({ width: image.naturalWidth, height: image.naturalHeight }); };
      image.onerror = () => { clearTimeout(timer); reject(new Error("无法读取图片，请选择有效图片。")); };
      image.src = url;
    });
  } finally { URL.revokeObjectURL(url); }
}
