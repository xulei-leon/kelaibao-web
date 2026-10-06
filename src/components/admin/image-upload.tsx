"use client";

import { useEffect, useRef, useState } from "react";
import { coverValidationError, type AdminMediaAsset } from "@/lib/admin/media-types";
import { confirmUploadedImage, imageDimensions, MediaUploadError, uploadImage, validateImageFile } from "@/lib/admin/media-upload";

export function ImageUpload({ purpose, disabled, csrf, onBusy, onUploaded, onPendingChange }: {
  purpose: "body" | "cover"; disabled: boolean; csrf: () => Promise<string>;
  onBusy: (busy: boolean) => void; onUploaded: (asset: AdminMediaAsset, alt: string) => void;
  onPendingChange?: (pending: boolean) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [alt, setAlt] = useState("");
  const [intent, setIntent] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const running = useRef(false);
  const input = useRef<HTMLInputElement>(null);
  const label = purpose === "cover" ? "封面" : "正文";
  useEffect(() => { onPendingChange?.(Boolean(file || alt || intent)); }, [file, alt, intent, onPendingChange]);

  async function run(confirmOnly: boolean) {
    if (running.current || disabled) return;
    if (!alt.trim() || alt.trim().length > 240) { setMessage("请填写 1～240 字的图片说明，帮助无法看到图片的读者。"); return; }
    if (!confirmOnly && !file) { setMessage("请先选择图片。"); return; }
    running.current = true;
    onBusy(true);
    setMessage("");
    try {
      const options = { csrf, onStage: setMessage, onIntent: setIntent };
      if (!confirmOnly && file) {
        validateImageFile(file);
        if (purpose === "cover") {
          if (file.size > 350 * 1024) throw new Error("封面不能超过 350 KB，请压缩后重新选择。");
          const dimensions = await imageDimensions(file);
          const reason = coverValidationError({ ...dimensions, byteSize: file.size });
          if (reason) throw new Error(reason);
        }
      }
      const asset = confirmOnly && intent
        ? await confirmUploadedImage(intent, options)
        : await uploadImage(file!, options);
      if (purpose === "cover") {
        const reason = coverValidationError(asset);
        if (reason) { setIntent(null); throw new Error(reason); }
      }
      onUploaded(asset, alt.trim());
      setIntent(null); setFile(null); setAlt("");
      if (input.current) input.current.value = "";
      setMessage(purpose === "cover" ? "封面已上传，请确认可公开使用后保存草稿。" : "图片已添加到正文末尾，请保存草稿。");
    } catch (error) {
      if (error instanceof MediaUploadError && error.intentId) {
        setIntent(error.retryable || /会话|连接/.test(error.message) ? error.intentId : null);
      }
      setMessage(error instanceof Error ? error.message : "图片上传失败，请重试。");
    } finally { running.current = false; onBusy(false); }
  }

  return <div className="grid min-w-0 gap-3 rounded border border-black/15 bg-white p-4">
    <label className="grid gap-2"><span>{label}图片</span><input ref={input} type="file" accept="image/jpeg,image/png,image/webp" disabled={disabled} onChange={e => { setFile(e.target.files?.[0] ?? null); setIntent(null); setMessage(""); }} className="w-full min-w-0 text-sm file:mr-2 file:rounded file:border file:border-black/20 file:px-3 file:py-3" /></label>
    <label className="grid gap-2"><span>{label}图片说明</span><input value={alt} maxLength={240} onChange={e => setAlt(e.target.value)} disabled={disabled} placeholder="描述图片内容，不使用文件名" className="min-h-11 w-full min-w-0 rounded border border-black/20 px-3" /></label>
    <div className="flex flex-wrap gap-2">
      <button type="button" disabled={disabled || !file} className="min-h-11 rounded border border-black px-4 disabled:opacity-40" onClick={() => void run(false)}>{purpose === "cover" ? "上传封面" : "上传并插入正文"}</button>
      {intent ? <button type="button" disabled={disabled} className="min-h-11 rounded border border-black px-4 disabled:opacity-40" onClick={() => void run(true)}>重试确认</button> : null}
      {file || alt || intent ? <button type="button" disabled={disabled} className="min-h-11 rounded border border-black/20 px-4" onClick={() => {
        setFile(null); setAlt(""); setIntent(null); setMessage("已放弃本次图片操作，已有正文和封面未改变。");
        if (input.current) input.current.value = "";
      }}>放弃{label}图片操作</button> : null}
    </div>
    <p role="status" className="break-words text-sm text-black/65">{message || (purpose === "cover" ? "JPEG / PNG / WebP；至少 1200×630，约 1.90:1，最大 350 KB。" : "JPEG / PNG / WebP，最大 10 MB。")}</p>
  </div>;
}
