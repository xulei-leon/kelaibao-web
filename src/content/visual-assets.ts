export type VisualAssetStatus = "provisional" | "final";

export interface VisualAssetDefinition {
  id: string;
  src: string;
  alt: string;
  width: number;
  height: number;
  status: VisualAssetStatus;
  focalPoint?: string;
}

export const VISUAL_ASSET_IDS = [
  "home-hero",
  "features-hero",
  "home-tool-content",
  "home-tool-showcase",
  "home-tool-team",
  "home-tool-growth",
  "feature-today-hotspot",
  "feature-daily-health",
  "feature-future-weekly",
  "feature-business-insight",
  "feature-digital-card",
  "feature-promotion-poster",
  "feature-brand-journal",
  "feature-team-mini-program",
  "feature-resource-market",
  "feature-network-circle",
  "team-hero",
  "media-hero",
  "about-hero",
] as const;

export type VisualAssetId = (typeof VISUAL_ASSET_IDS)[number];

const definitions: Record<VisualAssetId, VisualAssetDefinition> = {
  "home-hero": {
    id: "home-hero",
    src: "/visual/image/hero-banner/home-01.webp",
    alt: "K-Link 从内容触达到持续连接的可信增长网络结构示意",
    width: 2400,
    height: 1000,
    status: "final",
    focalPoint: "50% 50%",
  },
  "features-hero": {
    id: "features-hero",
    src: "/visual/image/hero-banner/features-01.webp",
    alt: "K-Link 五阶段客户经营路径与数字工具系统示意",
    width: 2400,
    height: 1000,
    status: "final",
    focalPoint: "50% 50%",
  },
  "home-tool-content": {
    id: "home-tool-content",
    src: "/visual/image/home/home-02.webp",
    alt: "内容工具从信息整理到社群分享的结构示意",
    width: 1200,
    height: 800,
    status: "final",
    focalPoint: "50% 50%",
  },
  "home-tool-showcase": {
    id: "home-tool-showcase",
    src: "/visual/image/home/home-03.webp",
    alt: "展示工具连接个人信息与传播素材的结构示意",
    width: 1200,
    height: 800,
    status: "final",
    focalPoint: "50% 50%",
  },
  "home-tool-team": {
    id: "home-tool-team",
    src: "/visual/image/home/home-04.webp",
    alt: "团队工具连接品牌内容与成员协作的结构示意",
    width: 1200,
    height: 800,
    status: "final",
    focalPoint: "50% 50%",
  },
  "home-tool-growth": {
    id: "home-tool-growth",
    src: "/visual/image/home/home-05.webp",
    alt: "效率工具连接资源发现与社群触达的结构示意",
    width: 1200,
    height: 800,
    status: "final",
    focalPoint: "50% 50%",
  },
  "feature-today-hotspot": {
    id: "feature-today-hotspot",
    src: "/visual/image/features/features-02.webp",
    alt: "今日热点内容聚合与分享路径结构示意",
    width: 1242,
    height: 2208,
    status: "final",
    focalPoint: "50% 45%",
  },
  "feature-daily-health": {
    id: "feature-daily-health",
    src: "/visual/image/features/features-03.webp",
    alt: "每日健康内容整理与持续传播结构示意",
    width: 1242,
    height: 2208,
    status: "final",
    focalPoint: "50% 45%",
  },
  "feature-future-weekly": {
    id: "feature-future-weekly",
    src: "/visual/image/features/features-04.webp",
    alt: "未来周报内容编排与周期触达结构示意",
    width: 1242,
    height: 2208,
    status: "final",
    focalPoint: "50% 45%",
  },
  "feature-business-insight": {
    id: "feature-business-insight",
    src: "/visual/image/features/features-05.webp",
    alt: "商业洞察信息组织与观点传播结构示意",
    width: 1242,
    height: 2208,
    status: "final",
    focalPoint: "50% 45%",
  },
  "feature-digital-card": {
    id: "feature-digital-card",
    src: "/visual/image/features/features-06.webp",
    alt: "数字名片信息呈现与连接路径结构示意",
    width: 1242,
    height: 2208,
    status: "final",
    focalPoint: "50% 45%",
  },
  "feature-promotion-poster": {
    id: "feature-promotion-poster",
    src: "/visual/image/features/features-07.webp",
    alt: "推广海报内容组合与分享路径结构示意",
    width: 1242,
    height: 2208,
    status: "final",
    focalPoint: "50% 45%",
  },
  "feature-brand-journal": {
    id: "feature-brand-journal",
    src: "/visual/image/features/features-08.webp",
    alt: "品牌专刊统一内容与成员传播结构示意",
    width: 1242,
    height: 2208,
    status: "final",
    focalPoint: "50% 45%",
  },
  "feature-team-mini-program": {
    id: "feature-team-mini-program",
    src: "/visual/image/features/features-09.webp",
    alt: "团队小程序连接品牌、成员与访客的结构示意",
    width: 1242,
    height: 2208,
    status: "final",
    focalPoint: "50% 45%",
  },
  "feature-resource-market": {
    id: "feature-resource-market",
    src: "/visual/image/features/features-10.webp",
    alt: "资源集市分类发现与需求连接结构示意",
    width: 1242,
    height: 2208,
    status: "final",
    focalPoint: "50% 45%",
  },
  "feature-network-circle": {
    id: "feature-network-circle",
    src: "/visual/image/features/features-11.webp",
    alt: "人脉社群圈关系发现与社群连接结构示意",
    width: 1242,
    height: 2208,
    status: "final",
    focalPoint: "50% 45%",
  },
  "team-hero": {
    id: "team-hero",
    src: "/visual/image/hero-banner/team-01.webp",
    alt: "团队内容、成员协作与品牌传播关系网络示意",
    width: 2400,
    height: 1000,
    status: "final",
    focalPoint: "50% 50%",
  },
  "media-hero": {
    id: "media-hero",
    src: "/visual/image/hero-banner/media-01.webp",
    alt: "客来宝媒体从专业表达连接公开传播渠道的生态示意",
    width: 2400,
    height: 1000,
    status: "final",
    focalPoint: "50% 50%",
  },
  "about-hero": {
    id: "about-hero",
    src: "/visual/image/hero-banner/about-01.webp",
    alt: "客来宝技术、内容、数据与运营能力协同底座示意",
    width: 2400,
    height: 1000,
    status: "final",
    focalPoint: "50% 50%",
  },
};

export function validateVisualAssetDefinition<T extends VisualAssetDefinition>(
  asset: T,
): T {
  if (!asset.id.trim()) throw new Error("Visual asset id is required");
  if (!/^\/visual\/image\/.+\.webp$/i.test(asset.src)) {
    throw new Error(`Visual asset ${asset.id} must use a local WebP path`);
  }
  if (!asset.alt.trim()) throw new Error(`Visual asset ${asset.id} alt is required`);
  if (!Number.isInteger(asset.width) || !Number.isInteger(asset.height) || asset.width <= 0 || asset.height <= 0) {
    throw new Error(`Visual asset ${asset.id} dimensions must be positive integers`);
  }
  if (asset.status !== "provisional" && asset.status !== "final") {
    throw new Error(`Visual asset ${asset.id} status is invalid`);
  }
  if (asset.focalPoint) {
    if (!/^\d{1,3}%\s+\d{1,3}%$/.test(asset.focalPoint)) {
      throw new Error(`Visual asset ${asset.id} focalPoint is invalid`);
    }
    const coordinates = asset.focalPoint.split(/\s+/).map((value) => Number.parseInt(value, 10));
    if (coordinates.some((value) => value < 0 || value > 100)) {
      throw new Error(`Visual asset ${asset.id} focalPoint is outside the image bounds`);
    }
  }
  return asset;
}

export const VISUAL_ASSETS = Object.fromEntries(
  VISUAL_ASSET_IDS.map((id) => [id, validateVisualAssetDefinition(definitions[id])]),
) as Record<VisualAssetId, VisualAssetDefinition>;

export function getVisualAsset(id: VisualAssetId): VisualAssetDefinition {
  const asset = VISUAL_ASSETS[id];
  if (!asset) throw new Error(`Unknown visual asset: ${String(id)}`);
  return asset;
}
