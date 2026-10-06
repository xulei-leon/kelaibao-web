export type InquiryOutcome =
  | "accepted"
  | "duplicate"
  | "honeypot_suppressed"
  | "validation_rejected"
  | "payload_rejected"
  | "rate_limited"
  | "delivery_unavailable"
  | "configuration_unavailable";

export interface InquiryTelemetryEvent {
  requestId: string;
  route: "/api/inquiry";
  outcome: InquiryOutcome;
  durationBucket: "lt_250ms" | "lt_1s" | "lt_5s" | "gte_5s";
  reason?: string;
}

export type InquiryTelemetry = (event: InquiryTelemetryEvent) => void;

export function durationBucket(durationMs: number) {
  if (durationMs < 250) return "lt_250ms" as const;
  if (durationMs < 1_000) return "lt_1s" as const;
  if (durationMs < 5_000) return "lt_5s" as const;
  return "gte_5s" as const;
}

export const emitInquiryTelemetry: InquiryTelemetry = (event) => {
  console.info(JSON.stringify({ event: "inquiry_request", ...event }));
};
