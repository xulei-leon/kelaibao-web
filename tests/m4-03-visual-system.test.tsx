import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fireEvent, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { VisualAssetSlot } from "@/components/visual-asset-slot";
import {
  VISUAL_ASSET_IDS,
  VISUAL_ASSETS,
  getVisualAsset,
  validateVisualAssetDefinition,
  type VisualAssetDefinition,
  type VisualAssetId,
} from "@/content/visual-assets";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

type PageModule = { default: () => React.ReactNode | Promise<React.ReactNode> };

async function renderPage(moduleId: string) {
  const page = await vi.importActual<PageModule>(moduleId);
  return renderToStaticMarkup(await page.default());
}

const provisionalAsset: VisualAssetDefinition = {
  id: "home-tool-content",
  src: "/visual/image/home/home-02.webp",
  alt: "测试结构示意",
  width: 1200,
  height: 800,
  status: "provisional",
  focalPoint: "50% 50%",
};

const EXPECTED_VISUAL_ASSETS: Record<VisualAssetId, VisualAssetDefinition> = {
  "home-hero": { id: "home-hero", src: "/visual/image/hero-banner/home-01.webp", alt: "K-Link 从内容触达到持续连接的可信增长网络结构示意", width: 2400, height: 1000, status: "final", focalPoint: "50% 50%" },
  "features-hero": { id: "features-hero", src: "/visual/image/hero-banner/features-01.webp", alt: "K-Link 五阶段客户经营路径与数字工具系统示意", width: 2400, height: 1000, status: "final", focalPoint: "50% 50%" },
  "home-tool-content": { id: "home-tool-content", src: "/visual/image/home/home-02.webp", alt: "内容工具从信息整理到社群分享的结构示意", width: 1200, height: 800, status: "final", focalPoint: "50% 50%" },
  "home-tool-showcase": { id: "home-tool-showcase", src: "/visual/image/home/home-03.webp", alt: "展示工具连接个人信息与传播素材的结构示意", width: 1200, height: 800, status: "final", focalPoint: "50% 50%" },
  "home-tool-team": { id: "home-tool-team", src: "/visual/image/home/home-04.webp", alt: "团队工具连接品牌内容与成员协作的结构示意", width: 1200, height: 800, status: "final", focalPoint: "50% 50%" },
  "home-tool-growth": { id: "home-tool-growth", src: "/visual/image/home/home-05.webp", alt: "效率工具连接资源发现与社群触达的结构示意", width: 1200, height: 800, status: "final", focalPoint: "50% 50%" },
  "feature-today-hotspot": { id: "feature-today-hotspot", src: "/visual/image/features/features-02.webp", alt: "今日热点内容聚合与分享路径结构示意", width: 1242, height: 2208, status: "final", focalPoint: "50% 45%" },
  "feature-daily-health": { id: "feature-daily-health", src: "/visual/image/features/features-03.webp", alt: "每日健康内容整理与持续传播结构示意", width: 1242, height: 2208, status: "final", focalPoint: "50% 45%" },
  "feature-future-weekly": { id: "feature-future-weekly", src: "/visual/image/features/features-04.webp", alt: "未来周报内容编排与周期触达结构示意", width: 1242, height: 2208, status: "final", focalPoint: "50% 45%" },
  "feature-business-insight": { id: "feature-business-insight", src: "/visual/image/features/features-05.webp", alt: "商业洞察信息组织与观点传播结构示意", width: 1242, height: 2208, status: "final", focalPoint: "50% 45%" },
  "feature-digital-card": { id: "feature-digital-card", src: "/visual/image/features/features-06.webp", alt: "数字名片信息呈现与连接路径结构示意", width: 1242, height: 2208, status: "final", focalPoint: "50% 45%" },
  "feature-promotion-poster": { id: "feature-promotion-poster", src: "/visual/image/features/features-07.webp", alt: "推广海报内容组合与分享路径结构示意", width: 1242, height: 2208, status: "final", focalPoint: "50% 45%" },
  "feature-brand-journal": { id: "feature-brand-journal", src: "/visual/image/features/features-08.webp", alt: "品牌专刊统一内容与成员传播结构示意", width: 1242, height: 2208, status: "final", focalPoint: "50% 45%" },
  "feature-team-mini-program": { id: "feature-team-mini-program", src: "/visual/image/features/features-09.webp", alt: "团队小程序连接品牌、成员与访客的结构示意", width: 1242, height: 2208, status: "final", focalPoint: "50% 45%" },
  "feature-resource-market": { id: "feature-resource-market", src: "/visual/image/features/features-10.webp", alt: "资源集市分类发现与需求连接结构示意", width: 1242, height: 2208, status: "final", focalPoint: "50% 45%" },
  "feature-network-circle": { id: "feature-network-circle", src: "/visual/image/features/features-11.webp", alt: "人脉社群圈关系发现与社群连接结构示意", width: 1242, height: 2208, status: "final", focalPoint: "50% 45%" },
  "team-hero": { id: "team-hero", src: "/visual/image/hero-banner/team-01.webp", alt: "团队内容、成员协作与品牌传播关系网络示意", width: 2400, height: 1000, status: "final", focalPoint: "50% 50%" },
  "media-hero": { id: "media-hero", src: "/visual/image/hero-banner/media-01.webp", alt: "客来宝媒体从专业表达连接公开传播渠道的生态示意", width: 2400, height: 1000, status: "final", focalPoint: "50% 50%" },
  "about-hero": { id: "about-hero", src: "/visual/image/hero-banner/about-01.webp", alt: "客来宝技术、内容、数据与运营能力协同底座示意", width: 2400, height: 1000, status: "final", focalPoint: "50% 50%" },
};

function readWebpDimensions(filePath: string) {
  const bytes = readFileSync(filePath);
  expect(bytes.toString("ascii", 0, 4)).toBe("RIFF");
  expect(bytes.toString("ascii", 8, 12)).toBe("WEBP");

  for (let offset = 12; offset + 8 <= bytes.length;) {
    const chunk = bytes.toString("ascii", offset, offset + 4);
    const size = bytes.readUInt32LE(offset + 4);
    const data = offset + 8;

    if (chunk === "VP8X") {
      return {
        width: bytes.readUIntLE(data + 4, 3) + 1,
        height: bytes.readUIntLE(data + 7, 3) + 1,
      };
    }
    if (chunk === "VP8L") {
      const bits = bytes.readUInt32LE(data + 1);
      return {
        width: (bits & 0x3fff) + 1,
        height: ((bits >>> 14) & 0x3fff) + 1,
      };
    }
    if (chunk === "VP8 ") {
      expect(bytes.subarray(data + 3, data + 6)).toEqual(Buffer.from([0x9d, 0x01, 0x2a]));
      return {
        width: bytes.readUInt16LE(data + 6) & 0x3fff,
        height: bytes.readUInt16LE(data + 8) & 0x3fff,
      };
    }

    offset = data + size + (size % 2);
  }

  throw new Error(`Unsupported WebP structure: ${filePath}`);
}

describe("M4-03 visual asset registry", () => {
  it("defines the exact 19 local WebP slots with approved metadata", () => {
    expect(VISUAL_ASSET_IDS).toHaveLength(19);
    expect(new Set(VISUAL_ASSET_IDS).size).toBe(19);
    expect(Object.keys(VISUAL_ASSETS).sort()).toEqual([...VISUAL_ASSET_IDS].sort());
    expect(VISUAL_ASSETS).toEqual(EXPECTED_VISUAL_ASSETS);

    for (const id of VISUAL_ASSET_IDS) {
      const asset = getVisualAsset(id);
      expect(validateVisualAssetDefinition(asset)).toEqual(asset);
      expect(asset.src).toMatch(/^\/visual\/image\/.+\/(?:home|features|team|media|about)-\d{2}\.webp$/);
      expect(asset.src).not.toMatch(/^https?:/);
      expect(asset.alt.trim().length).toBeGreaterThan(8);
      expect(asset.width).toBeGreaterThan(0);
      expect(asset.height).toBeGreaterThan(0);
      expect(asset.status).toBe("final");
      const filePath = join(process.cwd(), "public", asset.src);
      expect(existsSync(filePath)).toBe(true);
      expect(readWebpDimensions(filePath)).toEqual({
        width: asset.width,
        height: asset.height,
      });
    }
  });

  it("rejects remote URLs, invalid dimensions, statuses, alt text, and unknown ids", () => {
    expect(() =>
      validateVisualAssetDefinition({ ...provisionalAsset, src: "https://example.com/x.webp" }),
    ).toThrow(/local WebP/i);
    expect(() =>
      validateVisualAssetDefinition({ ...provisionalAsset, width: 0 }),
    ).toThrow(/dimensions/i);
    expect(() =>
      validateVisualAssetDefinition({ ...provisionalAsset, status: "draft" as "final" }),
    ).toThrow(/status/i);
    expect(() =>
      validateVisualAssetDefinition({ ...provisionalAsset, alt: "" }),
    ).toThrow(/alt/i);
    expect(() =>
      validateVisualAssetDefinition({ ...provisionalAsset, focalPoint: "101% 50%" }),
    ).toThrow(/outside the image bounds/i);
    expect(() => getVisualAsset("missing" as never)).toThrow(/unknown visual asset/i);
  });
});

describe("M4-03 VisualAssetSlot", () => {
  it("shows the approved dimensions only for provisional assets", () => {
    const { container, rerender } = render(<VisualAssetSlot asset={provisionalAsset} />);

    expect(screen.getByRole("img", { name: provisionalAsset.alt })).toBeInTheDocument();
    expect(screen.getByText("文件：home-02.webp · 建议尺寸 1200×800")).toBeInTheDocument();
    expect(container.querySelector("figure")?.style.getPropertyValue("--visual-aspect")).toBe(
      "1200 / 800",
    );

    rerender(
      <VisualAssetSlot asset={{ ...provisionalAsset, status: "final" }} />,
    );
    expect(screen.queryByText("建议尺寸 1200×800")).not.toBeInTheDocument();
  });

  it("keeps the aspect box, approved alt, and generated source after image failure", () => {
    render(<VisualAssetSlot asset={provisionalAsset} />);
    fireEvent.error(screen.getByRole("img", { name: provisionalAsset.alt }));

    expect(screen.getByRole("img", { name: provisionalAsset.alt })).toHaveClass(
      "visual-asset-slot__image",
    );
    expect(screen.getByRole("img", { name: provisionalAsset.alt })).toHaveAttribute(
      "src",
      expect.stringMatching(/^\/visual\/generated\//),
    );
    expect(screen.getByText("文件：home-02.webp · 建议尺寸 1200×800")).toBeInTheDocument();
  });

  it("marks Hero Banner dimensions directly on provisional images", () => {
    render(
      <VisualAssetSlot
        asset={{ ...provisionalAsset, width: 2400, height: 1000 }}
        dimensionLabel="Hero Banner"
      />,
    );

    expect(screen.getByText("文件：home-02.webp · Hero Banner · 2400×1000 px")).toBeInTheDocument();
  });
});

describe("M4-03 public page wiring", () => {
  it.each([
    ["@/app/page", 1],
    ["@/app/features/page", 1],
    ["@/app/team/page", 1],
    ["@/app/media/page", 1],
    ["@/app/about/page", 1],
  ] as const)("wires %s to %i art-directed hero pictures", async (moduleId, count) => {
    const html = await renderPage(moduleId);
    const root = document.createElement("div");
    root.innerHTML = html;

    expect(root.querySelectorAll("picture.hero-picture")).toHaveLength(count);
    expect(root.querySelector(".visual-asset-slot__size")).toBeNull();
    expect(root.querySelector(".feature-visual__topline")).toBeNull();
  });

  it("keeps the primary headline before the problem narrative in reading order", async () => {
    const html = await renderPage("@/app/page");

    expect(html.indexOf("你手机里躺着几百个微信群、几万个陌生群友——真正认识你的，有几个？")).toBeGreaterThanOrEqual(0);
    expect(html.indexOf("你手机里躺着几百个微信群、几万个陌生群友——真正认识你的，有几个？")).toBeLessThan(
      html.indexOf("熟人名单总会用完，陌生人才是下一站"),
    );
  });

  it("loads the M4-03 public overlay after the reversible M4-02 overlay in both routers", () => {
    const appLayout = readFileSync(join(process.cwd(), "src/app/layout.tsx"), "utf8");
    const pagesApp = readFileSync(join(process.cwd(), "src/pages/_app.tsx"), "utf8");

    expect(appLayout.indexOf('import "./m4-03-visual-system.css"')).toBeGreaterThan(
      appLayout.indexOf('import "./visual-refresh.css"'),
    );
    expect(pagesApp.indexOf('import "@/app/m4-03-visual-system.css"')).toBeGreaterThan(
      pagesApp.indexOf('import "@/app/visual-refresh.css"'),
    );
  });

  it("keeps the new stylesheet local, reduced-motion aware, and outside admin selectors", () => {
    const css = readFileSync(
      join(process.cwd(), "src/app/m4-03-visual-system.css"),
      "utf8",
    );

    expect(css).not.toMatch(/@import|url\(\s*["']?https?:/i);
    expect(css).not.toMatch(/\.admin(?:[-_:#.\s,{>+~]|$)/);
    expect(css).not.toContain("!important");
    expect(css).not.toContain("文件：");
    expect(css).toContain('url("/visual/image/hero-banner/news-01.webp")');
    expect(existsSync(join(process.cwd(), "public/visual/image/hero-banner/news-01.webp"))).toBe(true);
    expect(css).toContain("prefers-reduced-motion: reduce");
    expect(css).toContain(".public-site-main");
  });
});
