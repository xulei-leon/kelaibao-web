import {
  buildDirectMailRequest,
  createDirectMailProvider,
} from "@/server/inquiry/directmail";
import { resolveDirectMailConfig } from "@/server/inquiry/config";
import type { MainlandLeadRequest } from "@/types/site";
import { afterEach, describe, expect, it, vi } from "vitest";

const lead: MainlandLeadRequest = {
  name: "林顾问",
  profession: "insurance_broker",
  city: "深圳",
  contactMethod: "phone",
  contactValue: "13800138000",
  needs: "希望梳理进入中国市场的专业表达与长期内容建设方案。",
  privacyConsent: true,
};

const config = {
  endpoint: new URL("https://dm.aliyuncs.com/"),
  accessKeyId: "test-access-key",
  accessKeySecret: "test-secret-value",
  accountName: "notice@example.cn",
  fromAlias: "客来宝",
  toAddress: "approved-inbox@example.cn",
  timeoutMs: 5_000,
};

afterEach(() => {
  vi.useRealTimers();
});

describe("M2-05 DirectMail HTTPS provider", () => {
  it("builds one deterministic signed form POST without putting secrets in the URL", () => {
    const request = buildDirectMailRequest(lead, config, {
      timestamp: "2026-07-30T00:00:00Z",
      nonce: "nonce-0001",
    });
    const params = new URLSearchParams(request.body);

    expect(request.url).toBe("https://dm.aliyuncs.com/");
    expect(request.init.method).toBe("POST");
    expect(request.init.headers).toEqual({
      "Content-Type": "application/x-www-form-urlencoded",
    });
    expect(params.get("Action")).toBe("SingleSendMail");
    expect(params.get("Version")).toBe("2015-11-23");
    expect(params.get("AccessKeyId")).toBe("test-access-key");
    expect(params.get("SignatureNonce")).toBe("nonce-0001");
    expect(params.get("Timestamp")).toBe("2026-07-30T00:00:00Z");
    expect(params.get("AccountName")).toBe("notice@example.cn");
    expect(params.get("ToAddress")).toBe("approved-inbox@example.cn");
    expect(params.get("Subject")).toBe("客来宝官网咨询通知");
    expect(params.get("TextBody")).toContain("客来宝官网收到一条新咨询");
    expect(params.get("TextBody")).toContain(lead.needs);
    expect(params.get("TextBody")).not.toContain("赛诺全网");
    expect(params.get("Signature")).toBe("aldtNat+Qz1qI8CvKeRHNBAnPL0=");
    expect(request.url).not.toContain(config.accessKeyId);
    expect(request.body).not.toContain(config.accessKeySecret);
  });

  it("times out once, never retries, and never reads an upstream body", async () => {
    vi.useFakeTimers();
    const text = vi.fn().mockResolvedValue("upstream-secret-canary");
    const fetchImpl = vi.fn(
      (_url: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((resolve, reject) => {
          init?.signal?.addEventListener("abort", () =>
            reject(new DOMException("Aborted", "AbortError")),
          );
          void resolve;
        }),
    );
    const provider = createDirectMailProvider(config, {
      fetchImpl,
      now: () => new Date("2026-07-30T00:00:00Z"),
      nonce: () => "nonce-0001",
    });

    const result = provider.send(lead);
    await vi.advanceTimersByTimeAsync(5_000);

    await expect(result).resolves.toEqual({
      ok: false,
      reason: "directmail_timeout",
    });
    expect(fetchImpl).toHaveBeenCalledOnce();
    expect(text).not.toHaveBeenCalled();
  });

  it("maps non-success without reading the provider response body", async () => {
    const text = vi.fn().mockResolvedValue("upstream-secret-canary");
    const provider = createDirectMailProvider(config, {
      fetchImpl: vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        text,
      }),
      now: () => new Date("2026-07-30T00:00:00Z"),
      nonce: () => "nonce-0001",
    });

    await expect(provider.send(lead)).resolves.toEqual({
      ok: false,
      reason: "directmail_rejected",
    });
    expect(text).not.toHaveBeenCalled();
  });

  it("rejects unsafe or unapproved production endpoints", () => {
    const baseEnv = {
      SINO_RUNTIME_MODE: "production",
      DIRECTMAIL_ACCESS_KEY_ID: "test-access-key",
      DIRECTMAIL_ACCESS_KEY_SECRET: "test-secret-value",
      DIRECTMAIL_ACCOUNT_NAME: "notice@example.cn",
      DIRECTMAIL_FROM_ALIAS: "客来宝",
      DIRECTMAIL_TO_ADDRESS: "approved-inbox@example.cn",
    };

    expect(() =>
      resolveDirectMailConfig({
        ...baseEnv,
        DIRECTMAIL_ENDPOINT: "http://dm.aliyuncs.com/",
      }),
    ).toThrow(/HTTPS/i);
    expect(() =>
      resolveDirectMailConfig({
        ...baseEnv,
        DIRECTMAIL_ENDPOINT: "https://user:pass@dm.aliyuncs.com/",
      }),
    ).toThrow(/credentials/i);
    expect(() =>
      resolveDirectMailConfig({
        ...baseEnv,
        DIRECTMAIL_ENDPOINT: "https://example.com/?debug=1",
      }),
    ).toThrow(/approved/i);
    expect(
      resolveDirectMailConfig({
        ...baseEnv,
        DIRECTMAIL_ENDPOINT: "https://dm.aliyuncs.com/",
      }).endpoint.toString(),
    ).toBe("https://dm.aliyuncs.com/");
  });
});
