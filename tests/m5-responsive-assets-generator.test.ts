import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import sharp from "sharp";
import { afterEach, describe, expect, it } from "vitest";

// The production generator is intentionally plain ESM so it can run before
// Next.js compilation.
// @ts-expect-error JavaScript build helper has no separate declaration file.
import { buildResponsiveAssets } from "../scripts/build-responsive-assets.mjs";

const cleanups: string[] = [];

afterEach(async () => {
  while (cleanups.length) {
    const target = cleanups.pop();
    if (target) await rm(target, { force: true, recursive: true });
  }
});

async function fixtureProject() {
  const root = await mkdtemp(join(tmpdir(), "kelaibao-assets-"));
  cleanups.push(root);
  const source = join(root, "public", "visual", "image", "fixture", "source.webp");
  await mkdir(dirname(source), { recursive: true });
  await mkdir(join(root, "src", "content"), { recursive: true });
  await sharp({
    create: {
      width: 640,
      height: 360,
      channels: 3,
      background: "#123456",
    },
  }).webp().toFile(source);
  return { root, source };
}

const asset = {
  id: "fixture-hero",
  src: "/visual/image/fixture/source.webp",
  widths: [320, 640, 960],
  fallbackWidth: 640,
  kind: "hero",
};

describe("M5-01 responsive asset generator", () => {
  it("is deterministic, does not upscale, and changes the URL when source bytes change", async () => {
    const { root, source } = await fixtureProject();
    const first = await buildResponsiveAssets({ assets: [asset], projectDirectory: root });
    const second = await buildResponsiveAssets({ assets: [asset], projectDirectory: root });

    expect(second).toEqual(first);
    expect(first[asset.id].variants.map((variant: { width: number }) => variant.width)).toEqual([
      320,
      640,
    ]);
    expect(first[asset.id].fallbackSrc).toMatch(
      /^\/visual\/generated\/fixture-hero\/[a-f0-9]{20}\/640\.webp$/,
    );
    expect(
      await readFile(join(root, "src", "content", "responsive-assets.generated.ts"), "utf8"),
    ).toContain(first[asset.id].sourceHash);

    await sharp({
      create: {
        width: 640,
        height: 360,
        channels: 3,
        background: "#654321",
      },
    }).webp().toFile(source);
    const changed = await buildResponsiveAssets({ assets: [asset], projectDirectory: root });
    expect(changed[asset.id].sourceHash).not.toBe(first[asset.id].sourceHash);
    expect(changed[asset.id].fallbackSrc).not.toBe(first[asset.id].fallbackSrc);
  });

  it("rejects remote, escaping, duplicate, and invalid width definitions before clearing valid output", async () => {
    const { root } = await fixtureProject();
    const valid = await buildResponsiveAssets({ assets: [asset], projectDirectory: root });
    const validOutput = join(
      root,
      "public",
      ...valid[asset.id].fallbackSrc.split("/").filter(Boolean),
    );

    await expect(
      buildResponsiveAssets({
        assets: [{ ...asset, src: "https://remote.example/source.webp" }],
        projectDirectory: root,
      }),
    ).rejects.toThrow(/source is invalid/i);
    await expect(
      buildResponsiveAssets({
        assets: [{ ...asset, src: "/visual/image/../source.webp" }],
        projectDirectory: root,
      }),
    ).rejects.toThrow(/source is invalid/i);
    await expect(
      buildResponsiveAssets({ assets: [asset, asset], projectDirectory: root }),
    ).rejects.toThrow(/duplicate/i);
    await expect(
      buildResponsiveAssets({
        assets: [{ ...asset, widths: [320, 320] }],
        projectDirectory: root,
      }),
    ).rejects.toThrow(/widths are invalid/i);
    await expect(readFile(validOutput)).resolves.not.toHaveLength(0);
  });

  it("fails closed for corrupted sources and an unavailable fallback width", async () => {
    const { root, source } = await fixtureProject();
    await writeFile(source, Buffer.from("not-an-image"));
    await expect(
      buildResponsiveAssets({ assets: [asset], projectDirectory: root }),
    ).rejects.toThrow(/metadata is invalid/i);

    const next = await fixtureProject();
    await expect(
      buildResponsiveAssets({
        assets: [{ ...asset, fallbackWidth: 960 }],
        projectDirectory: next.root,
      }),
    ).rejects.toThrow(/fallback width is invalid/i);
  });
});
