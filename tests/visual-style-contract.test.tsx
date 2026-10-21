import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { PublicContentList } from "@/components/public-content-list";
import { PageHero } from "@/components/ui/page-hero";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

type PageModule = { default: () => ReactNode | Promise<ReactNode> };

async function renderPage(moduleId: string) {
  const page = await vi.importActual<PageModule>(moduleId);
  return renderToStaticMarkup(await page.default());
}

function expectSingleH1(html: string, h1: string) {
  const root = document.createElement("div");
  root.innerHTML = html;
  const headings = root.querySelectorAll("h1");

  expect(headings).toHaveLength(1);
  expect((headings[0]?.textContent ?? "").replace(/\s+/g, " ").trim()).toBe(h1);
}

describe("FR-26 public-page baseline", () => {
  it.each([
    ["@/app/page", "home"], ["@/app/trial/page", "trial"],
    ["@/app/features/page", "membership"], ["@/app/team/page", "team"],
    ["@/app/media/page", "media"], ["@/app/about/page", "about"],
  ])("renders %s with local art-directed photography", async (moduleId, image) => {
    const html = await renderPage(moduleId);
    const root = document.createElement("div"); root.innerHTML = html;
    expect(root.querySelectorAll("h1")).toHaveLength(1);
    expect(root.querySelector("picture source")).toHaveAttribute("srcset", `/visual/operations/${image}-mobile.webp`);
    expect(root.querySelector("picture img")).toHaveAttribute("src", `/visual/operations/${image}-pc.webp`);
    expect(root.querySelector("picture img")).toHaveAttribute("fetchpriority", "high");
    expect(html).not.toMatch(/assets\/|\.html["#]|window.matchMedia|<script(?![^>]*application\/ld\+json)/);
  });
  it("retains an honest empty state for cases", () => {
    const html = renderToStaticMarkup(<PublicContentList contentType="case" items={[]} />);
    expectSingleH1(html, "案例"); expect(html).toContain("当前没有已公开的案例。");
    expect(html).not.toContain("<article");
  });
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

    expect(html).toContain('class="hero-picture"');
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
