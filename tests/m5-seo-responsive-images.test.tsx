import { render, screen } from "@testing-library/react";
import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";

import { VisualAssetSlot } from "@/components/visual-asset-slot";
import { getVisualAsset } from "@/content/visual-assets";
import { normalizeContentDraft } from "@/server/content/domain";
import type { PublicContentSnapshot } from "@/server/content/public-contract";
import {
  buildPublicContentMetadata,
  buildPublicContentStructuredData,
  buildStaticPageStructuredData,
} from "@/server/discovery/metadata";
import { inspectAllowedImage } from "@/server/media/validation";

function png(width: number, height: number) {
  const bytes = Buffer.alloc(24);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(bytes);
  Buffer.from("IHDR").copy(bytes, 12);
  bytes.writeUInt32BE(width, 16);
  bytes.writeUInt32BE(height, 20);
  return bytes;
}

const coverImage = {
  url: "https://assets.example/media/7/cover-abc.webp",
  width: 1200,
  height: 630,
  alt: "活动现场的公开代表图",
  mimeType: "image/webp" as const,
};

const publicItem: PublicContentSnapshot = {
  id: 9,
  contentItemId: 3,
  revisionNumber: 4,
  contentType: "news",
  slug: "launch-update",
  title: "发布动态",
  summary: "公开摘要",
  sanitizedHtml: "<p>正文</p>",
  sanitizerPolicyVersion: "v1",
  firstPublishedAt: new Date("2026-08-08T00:00:00.000Z"),
  publishedAt: new Date("2026-08-08T00:00:00.000Z"),
  updatedAt: new Date("2026-08-08T00:00:00.000Z"),
  coverImage,
};

describe("M5-01 responsive images and structured data", () => {
  it("outputs a build-generated srcset without a Next image optimizer URL", () => {
    render(
      <VisualAssetSlot
        asset={getVisualAsset("feature-digital-card")}
        sizes="(max-width: 480px) calc(100vw - 72px), 290px"
      />,
    );
    const image = screen.getByRole("img");
    expect(image.getAttribute("srcset")).toContain(" 240w");
    expect(image.getAttribute("srcset")).toContain(" 640w");
    expect(image.getAttribute("src")).toMatch(/^\/visual\/generated\//);
    expect(image.getAttribute("src")).not.toContain("/_next/image");
    expect(image).toHaveAttribute("loading", "lazy");
  });

  it("parses trusted image dimensions during media confirmation", () => {
    const bytes = png(1200, 630);
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    expect(
      inspectAllowedImage(bytes, {
        expectedMimeType: "image/png",
        expectedByteSize: bytes.length,
        expectedSha256: sha256,
      }),
    ).toEqual({
      mimeType: "image/png",
      byteSize: bytes.length,
      sha256,
      width: 1200,
      height: 630,
    });
  });

  it("normalizes an optional cover pair and rejects incomplete input", () => {
    const normalized = normalizeContentDraft({
      contentType: "news",
      slug: "launch-update",
      title: "发布动态",
      summary: "公开摘要",
      sourceHtml: "<p>正文</p>",
      coverMediaAssetId: 17,
      coverAlt: "活动现场的公开代表图",
    });
    expect(normalized.coverMediaAssetId).toBe(17);
    expect(normalized.coverAlt).toBe("活动现场的公开代表图");
    expect(() =>
      normalizeContentDraft({
        contentType: "news",
        slug: "launch-update",
        title: "发布动态",
        summary: "公开摘要",
        sourceHtml: "<p>正文</p>",
        coverMediaAssetId: 17,
        coverAlt: "",
      }),
    ).toThrow(/cover/i);
    expect(() =>
      normalizeContentDraft({
        contentType: "news",
        slug: "launch-update",
        title: "发布动态",
        summary: "公开摘要",
        sourceHtml: "<p>正文</p>",
        coverMediaAssetId: 17,
        coverAlt: "IMG_20260808.webp",
      }),
    ).toThrow(/file name/i);
  });

  it("connects static pages to the single organization and service", () => {
    const nodes = buildStaticPageStructuredData(
      "/media",
      "https://www.example.cn",
    );
    expect(nodes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          "@type": "WebPage",
          "@id": "https://www.example.cn/media#webpage",
        }),
        expect.objectContaining({
          "@type": "Service",
          "@id": "https://www.example.cn/media#service",
          provider: { "@id": "https://www.example.cn/#organization" },
        }),
      ]),
    );
    expect(JSON.stringify(nodes)).not.toContain("SoftwareApplication");
  });

  it("uses one cover contract for visible metadata and Article JSON-LD", () => {
    const metadata = buildPublicContentMetadata(
      publicItem,
      "https://www.example.cn",
      true,
    );
    expect(metadata.openGraph?.images).toEqual([
      expect.objectContaining({
        url: coverImage.url,
        width: 1200,
        height: 630,
        alt: coverImage.alt,
      }),
    ]);
    const article = buildPublicContentStructuredData(
      publicItem,
      "https://www.example.cn",
    ).find((node) => node["@type"] === "NewsArticle");
    expect(article?.image).toEqual(
      expect.objectContaining({
        "@type": "ImageObject",
        contentUrl: coverImage.url,
        width: 1200,
        height: 630,
      }),
    );
    expect(article?.image).not.toHaveProperty("caption");
  });

  it("omits Article image when a revision has no real cover", () => {
    const metadata = buildPublicContentMetadata(
      { ...publicItem, coverImage: null },
      "https://www.example.cn",
      true,
    );
    expect(metadata.openGraph?.images).toEqual([
      expect.objectContaining({
        url: "https://www.example.cn/opengraph-image",
        width: 1200,
        height: 630,
      }),
    ]);
    const nodes = buildPublicContentStructuredData(
      { ...publicItem, coverImage: null },
      "https://www.example.cn",
    );
    const article = nodes.find((node) => node["@type"] === "NewsArticle");
    expect(article).not.toHaveProperty("image");
  });
});
