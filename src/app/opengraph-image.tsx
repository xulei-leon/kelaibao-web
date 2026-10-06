import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "客来宝｜K-Link 一站式拓客工具系统与客来宝媒体";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const dynamic = "force-static";
export const runtime = "nodejs";

export default async function OpenGraphImage() {
  const font = await readFile(
    join(
      process.cwd(),
      "node_modules",
      "@fontsource",
      "noto-sans-sc",
      "files",
      "noto-sans-sc-chinese-simplified-700-normal.woff",
    ),
  );
  const fontData = font.buffer.slice(
    font.byteOffset,
    font.byteOffset + font.byteLength,
  ) as ArrayBuffer;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: "#F5F1E8",
          color: "#0B1F33",
          padding: "76px 88px",
          flexDirection: "column",
          justifyContent: "space-between",
          fontFamily: "Noto Sans SC",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: "0.12em" }}>客来宝</div>
          <div style={{ color: "#53606C", fontSize: 22 }}>K-Link · 客来宝媒体</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 880 }}>
          <div style={{ width: 54, height: 4, marginBottom: 30, background: "#C6A15B" }} />
          <div style={{ fontSize: 64, lineHeight: 1.2, fontWeight: 700 }}>把真实经验，变成能长期使用的</div>
          <div style={{ fontSize: 64, lineHeight: 1.2, fontWeight: 700 }}>专业内容资产。</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ color: "#53606C", fontSize: 22 }}>定位 · 内容 · 持续表达</div>
          <div style={{ width: 210, height: 10, background: "#0F6B50" }} />
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Noto Sans SC",
          data: fontData,
          weight: 700,
          style: "normal",
        },
      ],
    },
  );
}
