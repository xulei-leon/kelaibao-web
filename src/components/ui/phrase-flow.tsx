import { Fragment } from "react";

interface PhraseFlowProps {
  phrases: readonly string[];
  separator: string;
}

export function PhraseFlow({ phrases, separator }: PhraseFlowProps) {
  const label = phrases.join(` ${separator} `);

  return (
    <span className="phrase-flow" aria-label={label}>
      {phrases.map((phrase, index) => (
        <Fragment key={phrase}>
          <span className="phrase-flow__item">
            {phrase}{index < phrases.length - 1 ? ` ${separator}` : ""}
          </span>
          {index < phrases.length - 1 ? " " : null}
        </Fragment>
      ))}
    </span>
  );
}
