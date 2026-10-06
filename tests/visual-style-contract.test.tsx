import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { PublicContentList } from "@/components/public-content-list";
import { PageHero } from "@/components/ui/page-hero";
import { PRIMARY_NAVIGATION } from "@/lib/site-content";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

interface StaticRouteBaseline {
  moduleId: string;
  h1: string;
  sectionCount: number;
  markers: string[];
  ctaLabels: string[];
  textDigest: string;
  h2: string[];
  h3: string[];
  sectionLabels: string[];
  keyCounts: Record<string, number>;
  hero: { actions: number; aside: boolean; boundary: boolean };
}

interface BaselineFixture {
  staticRoutes: Record<string, StaticRouteBaseline>;
  contentRoutes: Record<
    string,
    { contentType: "news" | "case"; h1: string; emptyState: string }
  >;
  global: { navigation: string[]; forbiddenCopy: string[] };
}

type PageModule = { default: () => ReactNode | Promise<ReactNode> };

const fixture = JSON.parse(
  readFileSync(
    join(process.cwd(), "tests/fixtures/m4-02-public-page-baseline.json"),
    "utf8",
  ),
) as BaselineFixture;

async function renderPage(moduleId: string) {
  const page = await vi.importActual<PageModule>(moduleId);
  return renderToStaticMarkup(await page.default());
}

function expectMarkersInOrder(html: string, markers: readonly string[]) {
  let previous = -1;
  for (const marker of markers) {
    const current = html.indexOf(marker, previous + 1);
    expect(current, marker).toBeGreaterThan(previous);
    previous = current;
  }
}

function expectSingleH1(html: string, h1: string) {
  const root = document.createElement("div");
  root.innerHTML = html;
  const headings = root.querySelectorAll("h1");

  expect(headings).toHaveLength(1);
  expect((headings[0]?.textContent ?? "").replace(/\s+/g, " ").trim()).toBe(h1);
}

function inspectRouteHtml(html: string) {
  const root = document.createElement("div");
  root.innerHTML = html;
  root.querySelectorAll(".visual-asset-slot__size").forEach((node) => node.remove());
  root
    .querySelectorAll('script[type="application/ld+json"]')
    .forEach((node) => node.remove());
  const normalizedText = (root.textContent ?? "").replace(/\s+/g, " ").trim();
  const headings = (level: "h2" | "h3") =>
    Array.from(root.querySelectorAll(level)).map((node) =>
      (node.textContent ?? "").replace(/\s+/g, " ").trim(),
    );

  return {
    textDigest: createHash("sha256").update(normalizedText).digest("hex"),
    h2: headings("h2"),
    h3: headings("h3"),
    sectionLabels: Array.from(root.querySelectorAll("section")).map((section) =>
      (section.querySelector("h1, h2, h3")?.textContent ?? "")
        .replace(/\s+/g, " ")
        .trim(),
    ),
    hero: {
      actions: root.querySelectorAll(".hero-actions > *").length,
      aside: Boolean(root.querySelector(".page-hero__aside")),
      boundary: Boolean(root.querySelector(".hero-boundary")),
    },
  };
}

describe("M4-02 public-page baseline fixture", () => {
  it.each(Object.entries(fixture.staticRoutes))(
    "freezes visible structure and copy for %s",
    async (_route, baseline) => {
      const html = await renderPage(baseline.moduleId);
      const observation = inspectRouteHtml(html);
      const root = document.createElement("div");
      root.innerHTML = html;
      root
        .querySelectorAll('script[type="application/ld+json"]')
        .forEach((node) => node.remove());

      expectSingleH1(html, baseline.h1);
      expect(html.match(/<section(?:\s|>)/g) ?? []).toHaveLength(
        baseline.sectionCount,
      );
      expectMarkersInOrder(html, baseline.markers);
      for (const label of baseline.ctaLabels) expect(html).toContain(label);
      for (const forbidden of fixture.global.forbiddenCopy) {
        expect(root.textContent).not.toContain(forbidden);
      }
      expect(observation).toEqual({
        textDigest: baseline.textDigest,
        h2: baseline.h2,
        h3: baseline.h3,
        sectionLabels: baseline.sectionLabels,
        hero: baseline.hero,
      });
      for (const [selector, count] of Object.entries(baseline.keyCounts)) {
        expect(root.querySelectorAll(selector), selector).toHaveLength(count);
      }
    },
  );

  it("freezes the exact six-item navigation", () => {
    expect(PRIMARY_NAVIGATION.map((item) => item.label)).toEqual(
      fixture.global.navigation,
    );
  });

  it.each(Object.entries(fixture.contentRoutes))(
    "freezes the honest empty state for %s",
    (_route, baseline) => {
      const html = renderToStaticMarkup(
        <PublicContentList contentType={baseline.contentType} items={[]} />,
      );

      expectSingleH1(html, baseline.h1);
      expect(html).toContain(baseline.emptyState);
      expect(html).toContain(`public-content-list--${baseline.contentType}`);
      expect(html).not.toContain("<article");
    },
  );
});

describe("M4-02 visual-only component contract", () => {
  it.each(["product", "solution", "editorial-dark"] as const)(
    "adds only the %s visual class to PageHero",
    (variant) => {
      const props = {
        eyebrow: "视觉契约",
        title: "标题保持不变",
        lead: "说明保持不变",
        actions: <a href="/about#contact">行动保持不变</a>,
        aside: <aside>侧栏保持不变</aside>,
        boundary: "边界保持不变",
      };
      const baseline = renderToStaticMarkup(<PageHero {...props} />);
      const themed = renderToStaticMarkup(
        <PageHero {...props} variant={variant} />,
      );

      expect(themed).toContain(`page-hero--${variant}`);
      expect(themed.replace(/ class="[^"]*"/g, "")).toBe(
        baseline.replace(/ class="[^"]*"/g, ""),
      );
    },
  );

  it("keeps the default PageHero backward compatible", () => {
    const html = renderToStaticMarkup(
      <PageHero eyebrow="" lead="说明" title="标题" />,
    );

    expect(html).toContain('class="page-hero"');
    expect(html).not.toContain("page-hero--product");
    expect(html).toContain('<p class="eyebrow"></p>');
  });

  it.each([
    ["@/app/page", "product"],
    ["@/app/features/page", "product"],
    ["@/app/team/page", "solution"],
    ["@/app/about/page", "solution"],
    ["@/app/media/page", "editorial-dark"],
  ] as const)("wires %s to the %s hero variant", async (moduleId, variant) => {
    const html = await renderPage(moduleId);

    expect(html).toContain(`page-hero--${variant}`);
  });

  it("loads the reversible overlay after globals.css in both routers", () => {
    const appLayout = readFileSync(
      join(process.cwd(), "src/app/layout.tsx"),
      "utf8",
    );
    const pagesApp = readFileSync(
      join(process.cwd(), "src/pages/_app.tsx"),
      "utf8",
    );

    expect(appLayout.indexOf('import "./visual-refresh.css"')).toBeGreaterThan(
      appLayout.indexOf('import "./globals.css"'),
    );
    expect(
      pagesApp.indexOf('import "@/app/visual-refresh.css"'),
    ).toBeGreaterThan(pagesApp.indexOf('import "@/app/globals.css"'));
  });

  it("uses the same public-only main boundary in both routers", () => {
    const appShell = readFileSync(
      join(process.cwd(), "src/components/public-app-shell.tsx"),
      "utf8",
    );
    const pagesApp = readFileSync(
      join(process.cwd(), "src/pages/_app.tsx"),
      "utf8",
    );

    expect(appShell).toContain('className="public-site-main"');
    expect(pagesApp).toContain('className="public-site-main"');
  });

  it("keeps the overlay free from remote assets and generated business copy", () => {
    const css = readFileSync(
      join(process.cwd(), "src/app/visual-refresh.css"),
      "utf8",
    );

    expect(css).not.toMatch(/@import|url\(\s*["']?https?:/i);
    expect(css).not.toMatch(/content\s*:\s*["'][^"']+["']/i);
    expect(css).not.toContain("!important");
    for (const section of [
      "tokens/base",
      "shell",
      "primitives",
      "pages",
      "responsive",
      "reduced-motion",
    ]) {
      expect(css).toContain(section);
    }
  });

  it("keeps base selectors inside public-site boundaries", () => {
    const css = readFileSync(
      join(process.cwd(), "src/app/visual-refresh.css"),
      "utf8",
    );

    expect(css).not.toMatch(
      /^\s*(?::root|html|body|h[1-6]|a|button|form|input|select|textarea)(?:\s|,|\{|:|\.|#|\[)/m,
    );
    expect(css).not.toMatch(/\.admin(?:[-_:#.\s,{>+~]|$)/);
    expect(css).toContain(".public-site-main");
    const tokenBoundary = css.match(
      /\/\* tokens\/base \*\/\s*(:where\([\s\S]*?\)\s*\{[\s\S]*?\})/,
    )?.[1];
    for (const publicRoot of [
      ".site-header",
      ".public-site-main",
      ".site-footer",
      ".dialog-backdrop",
      ".mobile-contact-bar",
    ]) {
      expect(tokenBoundary).toContain(publicRoot);
    }
  });

  it("disables non-essential movement for reduced motion", () => {
    const css = readFileSync(
      join(process.cwd(), "src/app/visual-refresh.css"),
      "utf8",
    );
    const reducedMotion = css.match(
      /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{([\s\S]*)\}\s*$/,
    )?.[1];

    expect(reducedMotion).toContain("transition-duration: 0.01ms");
    expect(reducedMotion).toContain("transform: none");
  });
});
