import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

export type CtaVariant = "navy-secondary" | "text-link" | "light-secondary";

interface ActionLinkProps {
  href: string;
  children: ReactNode;
  variant?: CtaVariant;
  className?: string;
}

export function ActionLink({
  href,
  children,
  variant = "navy-secondary",
  className = "",
}: ActionLinkProps) {
  return (
    <Link href={href} className={`cta cta--${variant} ${className}`.trim()}>
      <span>{children}</span>
      <ArrowRight aria-hidden="true" size={18} strokeWidth={1.8} />
    </Link>
  );
}
