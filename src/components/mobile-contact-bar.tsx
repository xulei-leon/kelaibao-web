"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { MiniProgramTrialButton } from "@/components/mini-program-trial";

const publicMarketingPaths = [
  "/",
  "/features",
  "/team",
  "/media",
  "/news",
  "/cases",
  "/about",
] as const;

export function MobileContactBar() {
  const pathname = usePathname();
  const resolvedPathname = pathname ?? "/";
  const [pastHero, setPastHero] = useState(false);
  const [footerVisible, setFooterVisible] = useState(false);
  const eligible = publicMarketingPaths.some((path) =>
    path === "/"
      ? resolvedPathname === "/"
      : resolvedPathname === path || resolvedPathname.startsWith(`${path}/`),
  );

  useEffect(() => {
    if (!eligible) {
      setPastHero(false);
      return;
    }
    const handleScroll = () => setPastHero(window.scrollY > 420);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    const footer = document.querySelector("footer");
    const observer = footer
      ? new IntersectionObserver(
          ([entry]) => setFooterVisible(entry.isIntersecting),
          { threshold: 0.05 },
        )
      : undefined;
    if (footer) observer?.observe(footer);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      observer?.disconnect();
    };
  }, [eligible]);

  if (!eligible) return null;

  return (
    <div
      className={`mobile-contact-bar ${pastHero && !footerVisible ? "mobile-contact-bar--visible" : ""}`}
    >
      <MiniProgramTrialButton
        source={`mobile-bar:${resolvedPathname}`}
        label="免费体验"
      />
    </div>
  );
}
