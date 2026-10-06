import { WORKFLOW_STEPS } from "@/lib/site-content";

interface WorkflowProps {
  detailed?: boolean;
}

export function Workflow({ detailed = false }: WorkflowProps) {
  return (
    <ol className={`workflow ${detailed ? "workflow--detailed" : ""}`}>
      {WORKFLOW_STEPS.map((step) => (
        <li className="workflow-step" key={step.id}>
          <div className="workflow-step__node">
            <span>{step.number}</span>
          </div>
          <div className="workflow-step__content">
            <h3>{step.title}</h3>
            <p>{step.description}</p>
            {detailed ? (
              <div className="structure-example">
                <span>结构示例</span>
                <strong>{step.deliverable}</strong>
              </div>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
