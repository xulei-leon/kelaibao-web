import type { ReactNode } from "react";

export type SectionTone = "ivory" | "white" | "navy" | "champagne-mist";

interface SectionProps {
  id?: string;
  tone?: SectionTone;
  eyebrow?: string;
  title?: string;
  description?: string;
  compact?: boolean;
  className?: string;
  children: ReactNode;
}

export function Section({
  id,
  tone = "ivory",
  eyebrow,
  title,
  description,
  compact = false,
  className = "",
  children,
}: SectionProps) {
  return (
    <section
      id={id}
      className={`section section--${tone} ${compact ? "section--compact" : ""} ${className}`.trim()}
    >
      <div className="site-container">
        {title ? (
          <header className="section-heading">
            {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
            <h2>{title}</h2>
            {description ? <p className="section-lead">{description}</p> : null}
          </header>
        ) : null}
        {children}
      </div>
    </section>
  );
}
