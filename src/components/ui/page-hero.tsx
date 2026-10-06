import type { ReactNode } from "react";

interface PageHeroProps {
  eyebrow: string;
  title: ReactNode;
  titleClassName?: string;
  lead: ReactNode;
  aside?: ReactNode;
  visual?: ReactNode;
  actions?: ReactNode;
  boundary?: string;
  compact?: boolean;
  variant?: "product" | "solution" | "editorial-dark";
}

export function PageHero({
  eyebrow,
  title,
  titleClassName,
  lead,
  aside,
  visual,
  actions,
  boundary,
  compact = false,
  variant,
}: PageHeroProps) {
  return (
    <section
      className={`page-hero ${aside ? "page-hero--split" : ""} ${visual ? "page-hero--visual page-hero--banner" : ""} ${compact ? "page-hero--compact" : ""} ${variant ? `page-hero--${variant}` : ""}`.trim()}
    >
      <div className="site-container page-hero__grid">
        <div className="page-hero__copy">
          <p className="eyebrow">{eyebrow}</p>
          <h1 className={titleClassName}>{title}</h1>
          <p className="page-hero__lead">{lead}</p>
          {actions ? <div className="hero-actions">{actions}</div> : null}
          {boundary ? <p className="hero-boundary">{boundary}</p> : null}
        </div>
        {aside ? <div className="page-hero__aside">{aside}</div> : null}
      </div>
      {visual ? <div className="page-hero__visual">{visual}</div> : null}
    </section>
  );
}
