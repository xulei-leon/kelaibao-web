import { readFileSync } from "node:fs";
import { join } from "node:path";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SiteHeader } from "@/components/site-header";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

describe("site header navigation state", () => {
  it("renders the exact six-item public navigation and product trial CTA", () => {
    render(<SiteHeader />);

    const navigation = within(screen.getByRole("navigation", { name: "主导航" }));
    const expectedNavigation = [
      ["首页", "/"],
      ["核心工具", "/features"],
      ["团队方案", "/team"],
      ["媒体服务", "/media"],
      ["新闻动态", "/news"],
      ["关于我们", "/about"],
    ] as const;
    const navigationLinks = Array.from(
      screen
        .getByRole("navigation", { name: "主导航" })
        .querySelectorAll("ul a"),
    );

    expect(
      navigationLinks.map((link) => [
        link.textContent?.trim(),
        link.getAttribute("href"),
      ]),
    ).toEqual(expectedNavigation);
    expect(navigation.getByRole("link", { name: "首页" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "客来宝首页" })).toHaveAttribute(
      "href",
      "/",
    );

    const trial = navigation.getByRole("link", { name: "免费体验" });
    expect(trial).toHaveAttribute("href", "/about#contact");
    expect(trial).toHaveClass("cta--product-primary");
    expect(trial).not.toHaveClass("cta--wechat-primary");
  });

  it("closes the mobile menu with Escape or a route selection and restores focus", async () => {
    const user = userEvent.setup();
    render(<SiteHeader />);
    const menuButton = screen.getByRole("button", { name: "打开导航菜单" });

    await user.click(menuButton);
    expect(menuButton).toHaveAttribute("aria-expanded", "true");
    await user.keyboard("{Escape}");
    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    expect(menuButton).toHaveFocus();

    await user.click(menuButton);
    const routeLink = screen.getByRole("link", { name: "核心工具" });
    routeLink.addEventListener("click", (event) => event.preventDefault(), {
      once: true,
    });
    await user.click(routeLink);
    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    expect(menuButton).toHaveFocus();
  });

  it("removes retired path literals from every known live link emitter", () => {
    const emitters = [
      "src/app/page.tsx",
      "src/components/site-footer.tsx",
      "src/components/mobile-contact-bar.tsx",
      "src/components/direct-sales-focus.tsx",
      "src/components/service-overview.tsx",
      "src/lib/site-content.ts",
    ];

    for (const file of emitters) {
      const source = readFileSync(join(process.cwd(), file), "utf8");
      expect(source, file).not.toMatch(/["'`]\/services(?:[#"'`])/);
      expect(source, file).not.toMatch(/["'`]\/method(?:[#"'`])/);
      expect(source, file).not.toMatch(/["'`]\/for\//);
    }
  });
});
