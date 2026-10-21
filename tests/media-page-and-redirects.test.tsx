import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import nextConfig from "../next.config";

const REDIRECTS = [
  { source: "/services", destination: "/media#services" },
  { source: "/for/direct-sales", destination: "/media#direct-sales" },
  { source: "/for/insurance", destination: "/media#insurance" },
  { source: "/for/securities", destination: "/media#securities" },
  { source: "/method", destination: "/media#method" },
] as const;

type MediaPageModule = {
  default: () => ReactNode | Promise<ReactNode>;
};

async function renderMediaPage() {
  const sourcePath = "src/app/media/page.tsx";
  expect(existsSync(join(process.cwd(), sourcePath)), sourcePath).toBe(true);
  if (!existsSync(join(process.cwd(), sourcePath))) return "";

  const page = await vi.importActual<MediaPageModule>("@/app/media/page");
  return renderToStaticMarkup(await page.default());
}

describe("M3-03 media page and legacy route migration", () => {
  it("renders the V3.3 media narrative, packages entry and five stable anchors", async () => {
    const html = await renderMediaPage();

    for (const value of ["发一篇，能用很久", "四档套餐", "聊方向", "给素材", "审稿子", "等发布"]) expect(html).toContain(value);
    expect(html).toContain('href="/media/packages"');

    const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(
      ([, id]) => id,
    );
    for (const anchor of [
      "services",
      "direct-sales",
      "insurance",
      "securities",
      "method",
    ]) {
      expect(ids.filter((id) => id === anchor), anchor).toHaveLength(1);
    }
  });

  it("stays inside the shared Kelaibao shell and uses only media consultation", async () => {
    const html = await renderMediaPage();

    expect(html).toContain("客来宝媒体");
    expect(html).toContain("咨询媒体服务");
    expect(html).not.toMatch(
      /aria-label="[^"]*客来宝媒体[^"]*导航"|class="[^"]*media-(?:nav|logo)/i,
    );
    expect(html).not.toMatch(
      /<img[^>]+(?:客来宝媒体.{0,16}(?:Logo|标志)|(?:Logo|标志).{0,16}客来宝媒体)/i,
    );
    expect(html).not.toMatch(/"@type"\s*:\s*"Organization"/);
    expect(html).not.toMatch(/免费体验 K-Link|#klink-trial/);
  });

  it("defines five exact native permanent redirects without a wildcard profession rule", async () => {
    expect(nextConfig.redirects).toBeTypeOf("function");
    if (!nextConfig.redirects) return;

    const redirects = await nextConfig.redirects();
    expect(redirects).toEqual(
      expect.arrayContaining(
        REDIRECTS.map((redirect) => ({ ...redirect, permanent: true })),
      ),
    );
    expect(
      redirects.some(
        ({ source }) => source.startsWith("/for/") && /:|\*/.test(source),
      ),
    ).toBe(false);
  });

  it("provides a no-follow HTTP smoke contract for query and fragment retention", () => {
    const scriptPath = join(process.cwd(), "scripts/smoke-media-redirects.mjs");
    expect(existsSync(scriptPath), "scripts/smoke-media-redirects.mjs").toBe(
      true,
    );
    if (!existsSync(scriptPath)) return;

    const source = readFileSync(scriptPath, "utf8");
    expect(source).toMatch(/redirect\s*:\s*["']manual["']/);
    expect(source).toContain("/services?utm_source=m3-03");
    expect(source).toContain("/media?utm_source=m3-03#services");
    expect(source).toContain("/for/other?x=1");
    expect(source).toMatch(/308/);
    expect(source).toMatch(/404/);
    for (const { source: path, destination } of REDIRECTS) {
      expect(source).toContain(path);
      expect(source).toContain(destination);
    }
  });
});
