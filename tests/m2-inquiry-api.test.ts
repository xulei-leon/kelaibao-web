import {
  INQUIRY_MAX_BODY_BYTES,
  handleInquiryRequest,
  type InquiryRequestDependencies,
} from "@/server/inquiry/service";
import {
  DELETE,
  GET,
  HEAD,
  OPTIONS,
  PATCH,
  POST,
  PUT,
} from "@/app/api/inquiry/route";
import { InquiryGuard } from "@/server/inquiry/guard";
import type { MainlandLeadRequest } from "@/types/site";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

const lead: MainlandLeadRequest = {
  name: "林顾问",
  profession: "insurance_broker",
  city: "深圳",
  contactMethod: "phone",
  contactValue: "13800138000",
  needs: "希望梳理进入中国市场的专业表达与长期内容建设方案。",
  privacyConsent: true,
};

function createGuard(now: () => number = () => 1_000) {
  return new InquiryGuard({
    clientIpHeader: "x-esa-client-ip",
    rateKeySecret: "r".repeat(32),
    rateLimitMax: 5,
    rateLimitWindowMs: 15 * 60_000,
    dedupeTtlMs: 10 * 60_000,
    maxEntries: 100,
    now,
  });
}

function createDependencies(
  overrides: Partial<InquiryRequestDependencies> = {},
): InquiryRequestDependencies {
  return {
    guard: createGuard(),
    mailer: {
      send: vi.fn().mockResolvedValue({ ok: true }),
    },
    requestIdFactory: () => "req-safe-001",
    telemetry: vi.fn(),
    now: () => 1_000,
    ...overrides,
  };
}

function inquiryRequest(
  body: unknown = lead,
  headers: Record<string, string> = {},
) {
  return new Request("https://www.example.cn/api/inquiry", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": "submission-00000001",
      "X-ESA-Client-IP": "203.0.113.8",
      ...headers,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("M2-05 inquiry route service", () => {
  it("accepts one valid bounded request without shared caching", async () => {
    const dependencies = createDependencies();
    const response = await handleInquiryRequest(
      inquiryRequest(),
      dependencies,
    );

    expect(response.status).toBe(202);
    expect(response.headers.get("Cache-Control")).toBe(
      "private, no-store, max-age=0",
    );
    expect(await response.json()).toEqual({
      ok: true,
      message: "已收到咨询，我们会由人工查看并联系你。",
      requestId: "req-safe-001",
    });
    expect(dependencies.mailer.send).toHaveBeenCalledOnce();
    expect(dependencies.mailer.send).toHaveBeenCalledWith(lead);
  });

  it("accepts application/json with a charset parameter", async () => {
    const response = await handleInquiryRequest(
      inquiryRequest(lead, {
        "Content-Type": "Application/JSON; Charset=UTF-8",
      }),
      createDependencies(),
    );

    expect(response.status).toBe(202);
  });

  it("suppresses a transport honeypot before JSON parsing or delivery", async () => {
    const dependencies = createDependencies();
    const response = await handleInquiryRequest(
      inquiryRequest("{not-json", {
        "X-Inquiry-Honeypot": "bot-company",
      }),
      dependencies,
    );

    expect(response.status).toBe(202);
    expect(dependencies.mailer.send).not.toHaveBeenCalled();
    expect(await response.text()).not.toContain("honeypot");
  });

  it.each([
    [
      "unknown JSON field",
      { ...lead, company: "" },
      { "Content-Type": "application/json" },
      400,
    ],
    [
      "invalid JSON",
      "{invalid",
      { "Content-Type": "application/json" },
      400,
    ],
    [
      "wrong content type",
      JSON.stringify(lead),
      { "Content-Type": "text/plain" },
      415,
    ],
    [
      "JSONP content type",
      JSON.stringify(lead),
      { "Content-Type": "application/jsonp" },
      415,
    ],
    [
      "missing privacy consent",
      { ...lead, privacyConsent: false },
      { "Content-Type": "application/json" },
      400,
    ],
    [
      "invalid phone",
      { ...lead, contactMethod: "phone", contactValue: "12345" },
      { "Content-Type": "application/json" },
      400,
    ],
    [
      "legacy wechat contact method",
      { ...lead, contactMethod: "wechat", contactValue: "lin-consult" },
      { "Content-Type": "application/json" },
      400,
    ],
  ])("rejects %s before DirectMail", async (_name, body, headers, status) => {
    const dependencies = createDependencies();
    const response = await handleInquiryRequest(
      inquiryRequest(body, headers),
      dependencies,
    );

    expect(response.status).toBe(status);
    expect(dependencies.mailer.send).not.toHaveBeenCalled();
  });

  it("rejects declared and actual oversized bodies", async () => {
    const dependencies = createDependencies();
    const declared = await handleInquiryRequest(
      inquiryRequest(lead, {
        "Content-Length": String(INQUIRY_MAX_BODY_BYTES + 1),
      }),
      dependencies,
    );
    const actual = await handleInquiryRequest(
      inquiryRequest(`"${"x".repeat(INQUIRY_MAX_BODY_BYTES + 1)}"`),
      dependencies,
    );

    expect(declared.status).toBe(413);
    expect(actual.status).toBe(413);
    expect(dependencies.mailer.send).not.toHaveBeenCalled();
  });

  it("returns duplicate success without sending a second message", async () => {
    const dependencies = createDependencies();

    const first = await handleInquiryRequest(
      inquiryRequest(),
      dependencies,
    );
    const duplicate = await handleInquiryRequest(
      inquiryRequest(),
      dependencies,
    );

    expect(first.status).toBe(202);
    expect(duplicate.status).toBe(202);
    expect(dependencies.mailer.send).toHaveBeenCalledTimes(1);
  });

  it("rate limits new submissions with Retry-After", async () => {
    const dependencies = createDependencies({
      guard: new InquiryGuard({
        clientIpHeader: "x-esa-client-ip",
        rateKeySecret: "r".repeat(32),
        rateLimitMax: 2,
        rateLimitWindowMs: 60_000,
        dedupeTtlMs: 60_000,
        maxEntries: 100,
        now: () => 1_000,
      }),
    });

    for (const idempotencyKey of [
      "submission-00000001",
      "submission-00000002",
    ]) {
      const response = await handleInquiryRequest(
        inquiryRequest(lead, { "Idempotency-Key": idempotencyKey }),
        dependencies,
      );
      expect(response.status).toBe(202);
    }
    const limited = await handleInquiryRequest(
      inquiryRequest(lead, {
        "Idempotency-Key": "submission-00000003",
      }),
      dependencies,
    );

    expect(limited.status).toBe(429);
    expect(limited.headers.get("Retry-After")).toBe("60");
    expect(dependencies.mailer.send).toHaveBeenCalledTimes(2);
  });

  it("keeps PII and hostile upstream details out of telemetry and responses", async () => {
    const telemetry = vi.fn();
    const canaries = [
      lead.name,
      lead.city,
      lead.contactValue,
      lead.needs,
      "upstream-secret-canary",
    ];
    const dependencies = createDependencies({
      telemetry,
      mailer: {
        send: vi.fn().mockResolvedValue({
          ok: false,
          reason: "directmail_rejected",
        }),
      },
    });

    const response = await handleInquiryRequest(
      inquiryRequest(),
      dependencies,
    );
    const evidence = JSON.stringify({
      telemetry: telemetry.mock.calls,
      response: await response.json(),
    });

    expect(response.status).toBe(503);
    for (const canary of canaries) {
      expect(evidence).not.toContain(canary);
    }
  });

  it("fails closed when runtime secrets are unavailable", async () => {
    vi.stubEnv("INQUIRY_RATE_KEY_SECRET", "");
    vi.stubEnv("DIRECTMAIL_ACCESS_KEY_ID", "");
    const consoleInfo = vi.spyOn(console, "info").mockImplementation(() => {});

    const response = await POST(inquiryRequest());
    const body = await response.text();

    expect(response.status).toBe(503);
    expect(response.headers.get("Cache-Control")).toBe(
      "private, no-store, max-age=0",
    );
    expect(body).not.toContain("INQUIRY_RATE_KEY_SECRET");
    expect(body).not.toContain("DIRECTMAIL_ACCESS_KEY_ID");
    expect(consoleInfo.mock.calls.join(" ")).not.toContain(lead.needs);
  });

  it.each([
    ["GET", GET],
    ["HEAD", HEAD],
    ["PUT", PUT],
    ["PATCH", PATCH],
    ["DELETE", DELETE],
    ["OPTIONS", OPTIONS],
  ])(
    "rejects %s with a private no-store method boundary",
    async (method, handler) => {
      const response = await handler(
        new Request("https://www.example.cn/api/inquiry", { method }),
      );

      expect(response.status).toBe(405);
      expect(response.headers.get("Allow")).toBe("POST");
      expect(response.headers.get("Cache-Control")).toBe(
        "private, no-store, max-age=0",
      );
    },
  );

  it("keeps the inquiry route independent from database and CMS modules", () => {
    const root = process.cwd();
    const paths = [
      "src/app/api/inquiry/route.ts",
      "src/server/inquiry/config.ts",
      "src/server/inquiry/directmail.ts",
      "src/server/inquiry/guard.ts",
      "src/server/inquiry/runtime.ts",
      "src/server/inquiry/service.ts",
      "src/server/inquiry/telemetry.ts",
    ];
    const source = paths
      .map((path) => readFileSync(join(root, path), "utf8"))
      .join("\n");

    expect(source).not.toMatch(/mysql|database_url|content repository/i);
    expect(source).not.toContain("products/sino-en/src");
    expect(source).not.toMatch(/\bwebservice\b/i);
  });
});
