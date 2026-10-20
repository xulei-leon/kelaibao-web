import { readFileSync } from "node:fs";
import { join } from "node:path";

import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";

import DisclaimerPage from "@/app/disclaimer/page";
import ErrorPage from "@/app/error";
import HealthPage from "@/app/health/page";
import NotFound from "@/app/not-found";
import PrivacyPage from "@/app/privacy/page";
import TermsPage from "@/app/terms/page";
import GlobalError from "@/app/global-error";
import {
  INTERNAL_COMPATIBILITY_ALLOWLIST,
  findPublicBrandLeaks as publicLeaks,
  findSourceBrandLeaks as sourceLeaks,
  scanPublicBrandSurfaces,
} from "../scripts/lib/public-brand-scanner.mjs";

const packageRoot = join(process.cwd());

describe("M3-05 public brand release contract", () => {
  it("keeps every simplified policy on the current brand and free of sales CTAs", () => {
    for (const Page of [PrivacyPage, TermsPage, DisclaimerPage]) {
      const html = renderToStaticMarkup(createElement(Page));
      expect(html).toContain("客来宝");
      expect(publicLeaks(html)).toEqual([]);
      expect(html).not.toMatch(/免费体验|咨询客来宝媒体|cta--(?:product|wechat)-primary/u);
    }
  });

  it("uses the current brand in health, and error-facing output", () => {
    const outputs = [
      renderToStaticMarkup(createElement(HealthPage)),
      renderToStaticMarkup(createElement(NotFound)),
      renderToStaticMarkup(
        createElement(ErrorPage, { error: new Error("secret"), reset: () => {} }),
      ),
      renderToStaticMarkup(
        createElement(GlobalError, { error: new Error("secret"), reset: () => {} }),
      ),
    ];

    for (const html of outputs) {
      expect(html).toContain("客来宝");
      expect(publicLeaks(html)).toEqual([]);
      expect(html).not.toContain("secret");
    }
  });

  it("scans only public/runtime identity surfaces and DirectMail templates", () => {
    const { findings } = scanPublicBrandSurfaces(packageRoot);

    expect(findings).toEqual([]);
    expect(readFileSync(join(packageRoot, "src/server/inquiry/directmail.ts"), "utf8"))
      .toContain("客来宝官网咨询通知");
  });

  it("fails closed for public leaks but excludes historical and fixture evidence", () => {
    expect(publicLeaks("https://saino.example.cn SINO_APP_VERSION site_key 赛诺全网"))
      .toEqual(expect.arrayContaining([
        expect.objectContaining({ kind: "saino-origin" }),
        expect.objectContaining({ kind: "internal-compatibility-identifier" }),
        expect.objectContaining({ kind: "multi-site-key" }),
        expect.objectContaining({ kind: "old-brand" }),
      ]));
    expect(sourceLeaks("docs/4-Reviews/legacy.md", "赛诺全网 https://saino.example.cn"))
      .toEqual([]);
    expect(sourceLeaks("docs/5-Evidence/m3-05/migration.md", "赛诺全网 site_key"))
      .toEqual([]);
    expect(sourceLeaks("tests/fixtures/legacy.json", "赛诺全网 site_key"))
      .toEqual([]);
  });

  it("allows only justified SRS compatibility identifiers, never site identity", () => {
    for (const [path, entry] of Object.entries(INTERNAL_COMPATIBILITY_ALLOWLIST)) {
      expect(entry.reason.length).toBeGreaterThan(20);
      expect(entry.identifiers).not.toContain("site_key");
      expect(entry.identifiers.every((identifier) => /^SINO_(?:RUNTIME_MODE|APP_VERSION)$/u.test(identifier)))
        .toBe(true);
      expect(sourceLeaks(path, entry.identifiers.join(" "))).toEqual([]);
    }
    expect(sourceLeaks("src/app/page.tsx", "SINO_RUNTIME_MODE")).not.toEqual([]);
    expect(sourceLeaks("src/server/config.ts", "https://saino.example.cn site_key")).not.toEqual([]);
  });
});
