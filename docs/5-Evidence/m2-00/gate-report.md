# M2-00 Gate Report

- Generated at: `2026-07-28T17:51:42.304Z`
- Overall status: `BLOCKED`
- Missing gates: None
- Blocked gates: G1, G2, G3, G4, G5, G6, G7, G8

## Summary

| Gate | Title | Status | Actual | Next action |
| --- | --- | --- | --- | --- |
| G1 | ESA origin to Function Compute | BLOCKED | Missing required configuration: isolatedOrigin, probeIdentity, originProbeUrl. | Provide isolatedOrigin, probeIdentity, originProbeUrl using isolated Alibaba Cloud resources and rerun. |
| G2 | Function Compute Next.js runtime | BLOCKED | Missing required configuration: isolatedOrigin, probeIdentity, ssrUrl, ssrMarker, routeHandlerUrl, streamUrl. | Provide isolatedOrigin, probeIdentity, ssrUrl, ssrMarker, routeHandlerUrl, streamUrl using isolated Alibaba Cloud resources and rerun. |
| G3 | Function Compute private VPC to RDS MySQL | BLOCKED | Missing required configuration: isolatedOrigin, probeIdentity, probeUrl. | Provide isolatedOrigin, probeIdentity, probeUrl using isolated Alibaba Cloud resources and rerun. |
| G4 | Private OSS upload and ESA distribution | BLOCKED | Missing required configuration: isolatedOrigin, probeIdentity, securityProbeUrl. | Provide isolatedOrigin, probeIdentity, securityProbeUrl using isolated Alibaba Cloud resources and rerun. |
| G5 | Same-domain session cookie through ESA | BLOCKED | Missing required configuration: isolatedOrigin, probeIdentity, setUrl, echoUrl. | Provide isolatedOrigin, probeIdentity, setUrl, echoUrl using isolated Alibaba Cloud resources and rerun. |
| G6 | DirectMail controlled test delivery | BLOCKED | Missing required configuration: isolatedOrigin, probeIdentity, probeUrl. | Provide isolatedOrigin, probeIdentity, probeUrl using isolated Alibaba Cloud resources and rerun. |
| G7 | ESA exact URL purge | BLOCKED | Missing required configuration: isolatedOrigin, probeIdentity, probeUrl. | Provide isolatedOrigin, probeIdentity, probeUrl using isolated Alibaba Cloud resources and rerun. |
| G8 | Versioned resource cost | BLOCKED | Missing cost inputs: currency, trafficAssumptions, quoteCapturedAt, quoteSource, monthlyHardLimit, estimatedMonthlyTotal. | Provide a real quote, traffic assumptions, and a budget hard limit without inventing values. |

## Detailed Evidence

### G1 ESA origin to Function Compute

- Verified at: `2026-07-28T17:51:42.304Z`
- Isolated resource: Missing isolated resource configuration.
- Execution: Preflight validation; no network request was sent.
- Expected: ESA must preserve Host, HTTPS, and client address information while using FC as the origin.
- Actual: Missing required configuration: isolatedOrigin, probeIdentity, originProbeUrl.
- Evidence path: `docs/5-Evidence/m2-00/gate-report.md`
- Sensitive data check: Only allowlisted booleans and non-sensitive runtime labels are recorded; credentials, cookies, response bodies, and PII are excluded.
- Status: `BLOCKED`
- Next action: Provide isolatedOrigin, probeIdentity, originProbeUrl using isolated Alibaba Cloud resources and rerun.

### G2 Function Compute Next.js runtime

- Verified at: `2026-07-28T17:51:42.304Z`
- Isolated resource: Missing isolated resource configuration.
- Execution: Preflight validation; no network request was sent.
- Expected: FC must run Next.js SSR, Route Handlers, and streaming/non-streaming responses.
- Actual: Missing required configuration: isolatedOrigin, probeIdentity, ssrUrl, ssrMarker, routeHandlerUrl, streamUrl.
- Evidence path: `docs/5-Evidence/m2-00/gate-report.md`
- Sensitive data check: Only allowlisted booleans and non-sensitive runtime labels are recorded; credentials, cookies, response bodies, and PII are excluded.
- Status: `BLOCKED`
- Next action: Provide isolatedOrigin, probeIdentity, ssrUrl, ssrMarker, routeHandlerUrl, streamUrl using isolated Alibaba Cloud resources and rerun.

### G3 Function Compute private VPC to RDS MySQL

- Verified at: `2026-07-28T17:51:42.304Z`
- Isolated resource: Missing isolated resource configuration.
- Execution: Preflight validation; no network request was sent.
- Expected: An FC-hosted probe must prove private VPC connectivity, SELECT 1, bounded connection reuse, and no public RDS endpoint.
- Actual: Missing required configuration: isolatedOrigin, probeIdentity, probeUrl.
- Evidence path: `docs/5-Evidence/m2-00/gate-report.md`
- Sensitive data check: Only allowlisted booleans and non-sensitive runtime labels are recorded; credentials, cookies, response bodies, and PII are excluded.
- Status: `BLOCKED`
- Next action: Provide isolatedOrigin, probeIdentity, probeUrl using isolated Alibaba Cloud resources and rerun.

### G4 Private OSS upload and ESA distribution

- Verified at: `2026-07-28T17:51:42.304Z`
- Isolated resource: Missing isolated resource configuration.
- Execution: Preflight validation; no network request was sent.
- Expected: Private Bucket, rejected direct read, controlled ESA origin, expiring upload, cross-key rejection, and no long-term browser credentials.
- Actual: Missing required configuration: isolatedOrigin, probeIdentity, securityProbeUrl.
- Evidence path: `docs/5-Evidence/m2-00/gate-report.md`
- Sensitive data check: Only allowlisted booleans and non-sensitive runtime labels are recorded; credentials, cookies, response bodies, and PII are excluded.
- Status: `BLOCKED`
- Next action: Provide isolatedOrigin, probeIdentity, securityProbeUrl using isolated Alibaba Cloud resources and rerun.

### G5 Same-domain session cookie through ESA

- Verified at: `2026-07-28T17:51:42.304Z`
- Isolated resource: Missing isolated resource configuration.
- Execution: Preflight validation; no network request was sent.
- Expected: A Secure, HttpOnly, SameSite=Strict cookie must round-trip through ESA to FC.
- Actual: Missing required configuration: isolatedOrigin, probeIdentity, setUrl, echoUrl.
- Evidence path: `docs/5-Evidence/m2-00/gate-report.md`
- Sensitive data check: Only allowlisted booleans and non-sensitive runtime labels are recorded; credentials, cookies, response bodies, and PII are excluded.
- Status: `BLOCKED`
- Next action: Provide isolatedOrigin, probeIdentity, setUrl, echoUrl using isolated Alibaba Cloud resources and rerun.

### G6 DirectMail controlled test delivery

- Verified at: `2026-07-28T17:51:42.304Z`
- Isolated resource: Missing isolated resource configuration.
- Execution: Preflight validation; no network request was sent.
- Expected: A provider-specific HTTPS call must deliver through an approved test domain without logging PII.
- Actual: Missing required configuration: isolatedOrigin, probeIdentity, probeUrl.
- Evidence path: `docs/5-Evidence/m2-00/gate-report.md`
- Sensitive data check: Only allowlisted booleans and non-sensitive runtime labels are recorded; credentials, cookies, response bodies, and PII are excluded.
- Status: `BLOCKED`
- Next action: Provide isolatedOrigin, probeIdentity, probeUrl using isolated Alibaba Cloud resources and rerun.

### G7 ESA exact URL purge

- Verified at: `2026-07-28T17:51:42.304Z`
- Isolated resource: Missing isolated resource configuration.
- Execution: Preflight validation; no network request was sent.
- Expected: A provider-specific HTTPS purge must invalidate only the recorded exact URLs.
- Actual: Missing required configuration: isolatedOrigin, probeIdentity, probeUrl.
- Evidence path: `docs/5-Evidence/m2-00/gate-report.md`
- Sensitive data check: Only allowlisted booleans and non-sensitive runtime labels are recorded; credentials, cookies, response bodies, and PII are excluded.
- Status: `BLOCKED`
- Next action: Provide isolatedOrigin, probeIdentity, probeUrl using isolated Alibaba Cloud resources and rerun.

### G8 Versioned resource cost

- Verified at: `2026-07-28T17:51:42.304Z`
- Isolated resource: unknown-region development/test/production candidate pricing
- Execution: Offline comparison of a versioned real quote against a versioned hard limit.
- Expected: A versioned quote and estimated monthly total at or below the budget hard limit.
- Actual: Missing cost inputs: currency, trafficAssumptions, quoteCapturedAt, quoteSource, monthlyHardLimit, estimatedMonthlyTotal.
- Evidence path: `docs/5-Evidence/m2-00/gate-report.md`
- Sensitive data check: Only allowlisted booleans and non-sensitive runtime labels are recorded; credentials, cookies, response bodies, and PII are excluded.
- Status: `BLOCKED`
- Next action: Provide a real quote, traffic assumptions, and a budget hard limit without inventing values.

