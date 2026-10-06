import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PROFESSIONS } from "@/lib/site-content";

interface ProfessionGridProps {
  secondaryOnly?: boolean;
}

export function ProfessionGrid({ secondaryOnly = false }: ProfessionGridProps) {
  const professions = secondaryOnly
    ? PROFESSIONS.filter(({ id }) => id !== "direct-sales")
    : PROFESSIONS;

  return (
    <div
      className={`profession-grid ${secondaryOnly ? "profession-grid--secondary" : ""}`}
    >
      {professions.map((profession, index) => (
        <article className="profession-card" key={profession.id}>
          <span className="profession-card__index">0{index + 1}</span>
          <h3>{profession.name}</h3>
          <p>{profession.scenarios[0]}</p>
          <Link href={`/media#${profession.id}`}>
            <span>了解适用服务</span>
            <ArrowRight aria-hidden="true" size={18} strokeWidth={1.8} />
          </Link>
        </article>
      ))}
    </div>
  );
}
