import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

export const INTERNAL_COMPATIBILITY_ALLOWLIST = Object.freeze({
  "src/app/health/page.tsx": {
    identifiers: ["SINO_APP_VERSION"],
    reason: "SRS-approved deployment version input; only its value is rendered.",
  },
  "src/server/config.ts": {
    identifiers: ["SINO_RUNTIME_MODE", "SINO_APP_VERSION"],
    reason: "SRS-approved server runtime protocol retained for M2 compatibility.",
  },
  "src/server/inquiry/config.ts": {
    identifiers: ["SINO_RUNTIME_MODE"],
    reason: "SRS-approved server runtime protocol used to fail closed in production.",
  },
});

export const PUBLIC_BRAND_SCAN_TARGETS = Object.freeze([
  "src/app",
  "src/components/public-content-list.tsx",
  "src/components/public-content-pages.tsx",
  "src/lib/route-metadata.ts",
  "src/lib/site-content.ts",
  "src/server/config.ts",
  "src/server/content/public-page.tsx",
  "src/server/discovery",
  "src/server/inquiry/config.ts",
  "src/server/inquiry/directmail.ts",
]);

export function findPublicBrandLeaks(value) {
  const rules = [
    ["old-brand", /\u8d5b\u8bfa\u5168\u7f51/giu],
    ["saino-origin", /https?:\/\/[^\s"'`<>)]*saino[^\s"'`<>)]*/giu],
    ["multi-site-key", /\bsite[_-]?key\b/giu],
    [
      "internal-compatibility-identifier",
      /\bSINO_(?:RUNTIME_MODE|APP_VERSION)\b/gu,
    ],
  ];

  return rules.flatMap(([kind, pattern]) =>
    [...value.matchAll(pattern)].map((match) => ({ kind, match: match[0] })),
  );
}

export function findSourceBrandLeaks(relativePath, value) {
  if (
    /^(?:docs\/(?:4-Reviews|5-Evidence)|tests\/fixtures)\//u.test(
      relativePath,
    )
  ) {
    return [];
  }

  const allowed = INTERNAL_COMPATIBILITY_ALLOWLIST[relativePath];
  const source = allowed
    ? allowed.identifiers.reduce(
        (current, identifier) => current.replaceAll(identifier, ""),
        value,
      )
    : value;
  return findPublicBrandLeaks(source);
}

function filesUnder(root) {
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const path = join(root, entry.name);
    return entry.isDirectory() ? filesUnder(path) : [path];
  });
}

export function scanPublicBrandSurfaces(packageRoot) {
  const files = PUBLIC_BRAND_SCAN_TARGETS.flatMap((target) => {
    const absolute = join(packageRoot, target);
    return /\.[cm]?[jt]sx?$/u.test(target) ? [absolute] : filesUnder(absolute);
  }).filter((path) => /\.[cm]?[jt]sx?$/u.test(path));
  const outputs = files.map((path) => ({
    path: relative(packageRoot, path).replaceAll("\\", "/"),
    content: readFileSync(path, "utf8"),
  }));
  const findings = outputs.flatMap(({ path, content }) =>
    findSourceBrandLeaks(path, content).map((leak) => ({ path, ...leak })),
  );
  return { outputs, findings };
}
