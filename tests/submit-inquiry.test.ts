import { submitInquiry } from "@/lib/submit-inquiry";
import type { MainlandLeadRequest } from "@/types/site";
import { afterEach, describe, expect, it, vi } from "vitest";

const payload: MainlandLeadRequest = {
  name: "林顾问",
  profession: "insurance_broker",
  city: "深圳",
  contactMethod: "phone",
  contactValue: "13800138000",
  needs: "希望梳理进入中国市场的专业表达与长期内容建设方案。",
  privacyConsent: true,
};

afterEach(() => {
  vi.useRealTimers();
});

describe("same-origin inquiry submission", () => {
  it("sends one exact JSON payload with bounded transport headers", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, status: 202 });
    await expect(
      submitInquiry(payload, {
        fetchImpl,
        honeypot: "",
        idempotencyKey: "submission-00000001",
      }),
    ).resolves.toEqual({ ok: true });

    expect(fetchImpl).toHaveBeenCalledOnce();
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe("/api/inquiry");
    expect(init).toEqual(
      expect.objectContaining({
        method: "POST",
        credentials: "same-origin",
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": "submission-00000001",
          "X-Inquiry-Honeypot": "",
        },
      }),
    );
    expect(JSON.parse(init.body)).toEqual(payload);
    expect(JSON.parse(init.body)).not.toHaveProperty("company");
  });

  it("carries the rendered honeypot only in the transport header", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, status: 202 });

    await submitInquiry(payload, {
      fetchImpl,
      honeypot: "bot-company",
      idempotencyKey: "submission-00000001",
    });

    const [, init] = fetchImpl.mock.calls[0];
    expect(init.headers["X-Inquiry-Honeypot"]).toBe("bot-company");
    expect(init.body).not.toContain("bot-company");
  });

  it("returns a generic failure without reading response bodies", async () => {
    const text = vi.fn().mockResolvedValue("private upstream diagnostics");
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      text,
    });
    await expect(
      submitInquiry(payload, {
        fetchImpl,
        honeypot: "",
        idempotencyKey: "submission-00000001",
      }),
    ).resolves.toEqual({ ok: false, reason: "request-failed" });
    expect(text).not.toHaveBeenCalled();
  });

  it("maps server rate limiting without reading response bodies", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
    });

    await expect(
      submitInquiry(payload, {
        fetchImpl,
        honeypot: "",
        idempotencyKey: "submission-00000001",
      }),
    ).resolves.toEqual({ ok: false, reason: "rate-limited" });
  });

  it("aborts once after the finite timeout and does not retry", async () => {
    vi.useFakeTimers();
    const fetchImpl = vi.fn((_url: RequestInfo | URL, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () =>
          reject(new DOMException("Aborted", "AbortError")),
        );
      }),
    );

    const result = submitInquiry(payload, {
      fetchImpl,
      honeypot: "",
      idempotencyKey: "submission-00000001",
      timeoutMs: 100,
    });
    await vi.advanceTimersByTimeAsync(100);

    await expect(result).resolves.toEqual({ ok: false, reason: "timeout" });
    expect(fetchImpl).toHaveBeenCalledOnce();
  });
});
