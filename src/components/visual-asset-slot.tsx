import type { CSSProperties } from "react";

import type { VisualAssetDefinition } from "@/content/visual-assets";
import { RESPONSIVE_ASSETS } from "@/content/responsive-assets.generated";

interface VisualAssetSlotProps {
  asset: VisualAssetDefinition;
  className?: string;
  dimensionLabel?: string;
  priority?: boolean;
  sizes?: string;
}

export function VisualAssetSlot({
  asset,
  className = "",
  dimensionLabel,
  priority = false,
  sizes = "(max-width: 768px) 100vw, 50vw",
}: VisualAssetSlotProps) {
  const style = {
    "--visual-aspect": `${asset.width} / ${asset.height}`,
    "--visual-focal": asset.focalPoint ?? "50% 50%",
  } as CSSProperties;
  const filename = asset.src.split("/").pop() ?? asset.src;
  const responsive = RESPONSIVE_ASSETS[asset.id as keyof typeof RESPONSIVE_ASSETS];
  if (!responsive) throw new Error(`Responsive asset manifest is missing: ${asset.id}`);
  const srcSet = responsive.variants
    .map((variant) => `${variant.src} ${variant.width}w`)
    .join(", ");

  return (
    <figure
      className={`visual-asset-slot visual-asset-slot--${asset.status} ${className}`.trim()}
      data-visual-asset-id={asset.id}
      data-visual-asset-status={asset.status}
      style={style}
    >
      <img
        alt={asset.alt}
        className="visual-asset-slot__image"
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
        height={asset.height}
        loading={priority ? "eager" : "lazy"}
        sizes={sizes}
        src={responsive.fallbackSrc}
        srcSet={srcSet}
        width={asset.width}
      />
      {asset.status === "provisional" ? (
        <figcaption className="visual-asset-slot__size">
          {dimensionLabel
            ? `文件：${filename} · ${dimensionLabel} · ${asset.width}×${asset.height} px`
            : `文件：${filename} · 建议尺寸 ${asset.width}×${asset.height}`}
        </figcaption>
      ) : null}
    </figure>
  );
}
