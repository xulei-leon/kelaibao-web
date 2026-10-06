// Public display metadata only; this module is safe for the browser bundle.
export interface AdminMediaAsset {
  id: number;
  publicUrl: string;
  mimeType: string;
  byteSize: number;
  width: number;
  height: number;
  publicUsageConfirmedAt: string | null;
}

export function coverValidationError(asset: Pick<AdminMediaAsset, "width" | "height" | "byteSize">) {
  if (asset.byteSize > 350 * 1024) return "封面不能超过 350 KB，请压缩后重新选择。";
  if (asset.width < 1200 || asset.height < 630 || Math.abs(asset.width / asset.height - 1200 / 630) > 0.08) {
    return "封面至少为 1200×630 像素，宽高比约 1.90:1。";
  }
  return null;
}
