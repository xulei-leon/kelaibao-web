import type { ReactNode } from "react";

type HeroImage = "home" | "trial" | "membership" | "team" | "media" | "news" | "about";

/** Art-directed sources preserve the separate mobile composition from operations. */
export function OperationsHero({ image, children }: { image: HeroImage; children: ReactNode }) {
  return (
    <section className="hero">
      <picture className="hero-picture">
        <source media="(max-width: 760px)" srcSet={`/visual/operations/${image}-mobile.webp`} width={750} height={1020} />
        <img alt="" src={`/visual/operations/${image}-pc.webp`} width={1920} height={680} fetchPriority="high" loading="eager" decoding="async" />
      </picture>
      {children}
    </section>
  );
}
