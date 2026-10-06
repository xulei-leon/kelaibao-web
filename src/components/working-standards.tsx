import { WORKING_STANDARDS } from "@/lib/site-content";

export function WorkingStandards() {
  return (
    <ol className="working-standards">
      {WORKING_STANDARDS.map((standard) => (
        <li key={standard.number}>
          <span>{standard.number}</span>
          <div>
            <h3>{standard.title}</h3>
            <p>{standard.description}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
