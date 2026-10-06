import type { ReactNode } from "react";
import type { AppProps } from "next/app";
import { cleanup, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  isPublicAppPath,
  PublicAppShell,
} from "@/components/public-app-shell";
import PagesApp from "@/pages/_app";

const navigation = vi.hoisted(() => ({ pathname: "/" as string | null }));

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
}));

vi.mock("@/components/analytics-page-view", () => ({
  AnalyticsPageView: () => <i data-testid="public-analytics" />,
}));

vi.mock("@/components/mobile-contact-bar", () => ({
  MobileContactBar: () => <aside data-testid="public-mobile-bar" />,
}));

vi.mock("@/components/site-footer", () => ({
  SiteFooter: () => <footer>Public footer</footer>,
}));

vi.mock("@/components/site-header", () => ({
  SiteHeader: () => <header>Public header</header>,
}));

vi.mock("@/components/mini-program-trial", () => ({
  MiniProgramTrialProvider: ({ children }: { children: ReactNode }) => (
    <div data-testid="mini-program-provider">{children}</div>
  ),
}));

vi.mock("@/components/wechat-contact", () => ({
  WechatContactProvider: ({ children }: { children: ReactNode }) => (
    <div data-testid="wechat-provider">{children}</div>
  ),
}));

function renderShell(pathname: string | null) {
  navigation.pathname = pathname;
  return render(
    <PublicAppShell structuredData={'{"@type":"Organization"}'}>
      <section>Route content</section>
    </PublicAppShell>,
  );
}

describe("public App Router shell boundary", () => {
  beforeEach(() => {
    cleanup();
    navigation.pathname = "/";
  });

  it.each([null, "/admin", "/admin/", "/admin/login", "/admin/news", "/health"])(
    "fails closed for %s and renders only route children",
    (pathname) => {
      const { container } = renderShell(pathname);

      expect(screen.getByText("Route content")).toBeInTheDocument();
      expect(screen.queryByRole("banner")).not.toBeInTheDocument();
      expect(screen.queryByRole("contentinfo")).not.toBeInTheDocument();
      expect(screen.queryByTestId("wechat-provider")).not.toBeInTheDocument();
      expect(screen.queryByTestId("mini-program-provider")).not.toBeInTheDocument();
      expect(screen.queryByTestId("public-mobile-bar")).not.toBeInTheDocument();
      expect(screen.queryByTestId("public-analytics")).not.toBeInTheDocument();
      expect(container.querySelector("main")).toBeNull();
      expect(container.querySelector('script[type="application/ld+json"]')).toBeNull();
    },
  );

  it.each(["/", "/features", "/media", "/administrator"])(
    "keeps the public shell for %s",
    (pathname) => {
      const { container } = renderShell(pathname);

      expect(isPublicAppPath(pathname)).toBe(true);
      expect(screen.getByRole("banner")).toHaveTextContent("Public header");
      expect(screen.getByRole("contentinfo")).toHaveTextContent("Public footer");
      expect(screen.getByTestId("wechat-provider")).toBeInTheDocument();
      expect(screen.getByTestId("mini-program-provider")).toBeInTheDocument();
      expect(screen.getByTestId("public-mobile-bar")).toBeInTheDocument();
      expect(screen.getByTestId("public-analytics")).toBeInTheDocument();
      expect(container.querySelectorAll("main")).toHaveLength(1);
      expect(container.querySelector("main")).toHaveTextContent("Route content");
      expect(
        container.querySelector('script[type="application/ld+json"]'),
      ).toHaveTextContent("Organization");
    },
  );

  it("keeps both contact providers around the Pages Router public shell", () => {
    const props = {
      Component: () => <article>Pages route content</article>,
      pageProps: {},
      router: {},
    } as unknown as AppProps;

    render(<PagesApp {...props} />);

    expect(screen.getByTestId("wechat-provider")).toBeInTheDocument();
    expect(screen.getByTestId("mini-program-provider")).toBeInTheDocument();
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("main")).toHaveTextContent("Pages route content");
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });
});
