import type { MainlandLeadRequest } from "@/types/site";

export type InquirySubmitResult =
  | { ok: true }
  | {
      ok: false;
      reason: "timeout" | "rate-limited" | "request-failed";
    };

interface SubmitInquiryOptions {
  honeypot: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
  idempotencyKey?: string;
}

function submissionId() {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  if (typeof globalThis.crypto?.getRandomValues === "function") {
    const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16));
    return `submission-${Array.from(bytes, (byte) =>
      byte.toString(16).padStart(2, "0"),
    ).join("")}`;
  }
  return `submission-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

export async function submitInquiry(
  payload: MainlandLeadRequest,
  options: SubmitInquiryOptions,
): Promise<InquirySubmitResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 8_000);

  try {
    const response = await (options.fetchImpl ?? fetch)("/api/inquiry", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": options.idempotencyKey ?? submissionId(),
        "X-Inquiry-Honeypot": options.honeypot.slice(0, 200),
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
      credentials: "same-origin",
      referrerPolicy: "same-origin",
    });

    if (response.ok) return { ok: true };
    return {
      ok: false,
      reason: response.status === 429 ? "rate-limited" : "request-failed",
    };
  } catch (error) {
    return {
      ok: false,
      reason:
        error instanceof DOMException && error.name === "AbortError"
          ? "timeout"
          : "request-failed",
    };
  } finally {
    clearTimeout(timeout);
  }
}
