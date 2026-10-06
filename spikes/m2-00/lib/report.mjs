function escapeCell(value) {
  return String(value ?? "")
    .replaceAll("|", "\\|")
    .replace(/\r?\n/g, "<br>");
}

export function renderMarkdownReport(report) {
  const rows = report.gates
    .map(
      (gate) =>
        `| ${gate.id} | ${escapeCell(gate.title)} | ${gate.status} | ${escapeCell(gate.actual)} | ${escapeCell(gate.nextAction)} |`,
    )
    .join("\n");

  return `# M2-00 Gate Report

- Generated at: \`${report.generatedAt}\`
- Overall status: \`${report.overallStatus}\`
- Missing gates: ${report.missingGateIds.length ? report.missingGateIds.join(", ") : "None"}
- Blocked gates: ${report.blockedGateIds.length ? report.blockedGateIds.join(", ") : "None"}

## Summary

| Gate | Title | Status | Actual | Next action |
| --- | --- | --- | --- | --- |
${rows}

## Detailed Evidence

${report.gates
  .map(
    (gate) => `### ${gate.id} ${gate.title}

- Verified at: \`${gate.verifiedAt}\`
- Isolated resource: ${gate.isolatedResource}
- Execution: ${gate.execution}
- Expected: ${gate.expected}
- Actual: ${gate.actual}
- Evidence path: \`${gate.evidencePath}\`
- Sensitive data check: ${gate.sensitiveDataCheck}
- Status: \`${gate.status}\`
- Next action: ${gate.nextAction}
`,
  )
  .join("\n")}
`;
}
