"use client";

import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { MiniProgramTrialButton } from "@/components/mini-program-trial";
import { BRAND, PRIMARY_NAVIGATION } from "@/lib/site-content";

export function SiteHeader() {
  const pathname = usePathname();
  const resolvedPathname = pathname ?? "/";
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const closeMenu = useCallback((restoreFocus = true) => {
    setMenuOpen(false);
    if (restoreFocus) {
      window.setTimeout(() => menuButtonRef.current?.focus(), 0);
    }
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      closeMenu();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [closeMenu, menuOpen]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <header className="site-header">
      <div className="site-container site-header__inner">
        <Link className="wordmark" href="/" aria-label="客来宝首页">
          <Image
            alt="客来宝 K-Link"
            className="wordmark__logo"
            height={72}
            priority
            src="/brand/kelaibao-k-link-logo.png"
            unoptimized
            width={240}
          />
          <small>{BRAND.descriptor}</small>
        </Link>
        <button
          aria-controls="primary-navigation"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "关闭导航菜单" : "打开导航菜单"}
          className="menu-button"
          onClick={() => {
            if (menuOpen) {
              closeMenu();
            } else {
              setMenuOpen(true);
            }
          }}
          ref={menuButtonRef}
          type="button"
        >
          {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
        <nav
          aria-label="主导航"
          className={`primary-nav ${menuOpen ? "primary-nav--open" : ""}`}
          id="primary-navigation"
        >
          <ul>
            {PRIMARY_NAVIGATION.map((item) => {
              const exactPath = item.href.split("#")[0] || "/";
              const isPageLink = !item.href.includes("#");
              const isCurrent =
                isPageLink &&
                (exactPath === "/"
                  ? resolvedPathname === "/"
                  : resolvedPathname === exactPath ||
                    resolvedPathname.startsWith(`${exactPath}/`));
              return (
                <li key={item.label}>
                  <Link
                    aria-current={isCurrent ? "page" : undefined}
                    href={item.href}
                    onClick={() => {
                      if (menuOpen) closeMenu();
                    }}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          <MiniProgramTrialButton
            compact
            source={`header:${resolvedPathname}`}
          />
        </nav>
      </div>
    </header>
  );
}
