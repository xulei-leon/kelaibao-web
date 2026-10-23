import type { ReactNode } from "react";

type HeroImage = "home" | "trial" | "membership" | "team" | "media" | "news" | "about";

/** Home shares one composition; other pages retain their art-directed mobile sources. */
export function OperationsHero({ image, children }: { image: HeroImage; children: ReactNode }) {
  const isHome = image === "home";

  return (
    <section className="hero">
      <picture className="hero-picture">
        {!isHome && <source media="(max-width: 760px)" srcSet={`/visual/operations/${image}-mobile.webp`} width={750} height={1020} />}
        <img alt="" src={isHome ? "/visual/operations/home-banner.webp" : `/visual/operations/${image}-pc.webp`} width={isHome ? 2048 : 1920} height={isHome ? 1152 : 680} fetchPriority="high" loading="eager" decoding="async" />
      </picture>
      {children}
    </section>
  );
}
