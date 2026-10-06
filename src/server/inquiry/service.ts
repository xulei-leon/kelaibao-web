import type { InquiryMailer } from "@/server/inquiry/directmail";
import type { InquiryGuard } from "@/server/inquiry/guard";
import {
  durationBucket,
  type InquiryOutcome,
  type InquiryTelemetry,
} from "@/server/inquiry/telemetry";
import type { MainlandLeadRequest } from "@/types/site";

export const INQUIRY_MAX_BODY_BYTES = 16 * 1_024;
const MAX_HONEYPOT_LENGTH = 200;
const PRIVATE_NO_STORE = "private, no-store, max-age=0";
const SUCCESS_MESSAGE = "已收到咨询，我们会由人工查看并联系你。";
const FAILURE_MESSAGE = "暂时无法提交，请稍后重试或使用企业微信联系。";

export interface InquiryRequestDependencies {
  guard: InquiryGuard;
  mailer: InquiryMailer;
  requestIdFactory: () => string;
  telemetry: InquiryTelemetry;
  now: () => number;
}

class InquiryRequestError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

const allowedKeys = new Set([
  "name",
  "profession",
  "city",
  "contactMethod",
  "contactValue",
  "needs",
  "privacyConsent",
]);
const professions = new Set([
  "direct_sales",
  "insurance_broker",
  "securities_broker",
  "other",
]);
const contactMethods = new Set(["phone"]);

function textLength(value: string) {
  return Array.from(value).length;
}

function requireString(
  input: Record<string, unknown>,
  key: string,
  minimum: number,
  maximum: number,
) {
  const value = input[key];
  if (typeof value !== "string") {
    throw new InquiryRequestError(400, "invalid_request", "Invalid inquiry request.");
  }
  const normalized = value.trim();
  const length = textLength(normalized);
  if (length < minimum || length > maximum) {
    throw new InquiryRequestError(400, "invalid_request", "Invalid inquiry request.");
  }
  return normalized;
}

function parseLeadRequest(input: unknown): MainlandLeadRequest {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new InquiryRequestError(400, "invalid_request", "Invalid inquiry request.");
  }
  const record = input as Record<string, unknown>;
  if (Object.keys(record).some((key) => !allowedKeys.has(key))) {
    throw new InquiryRequestError(400, "invalid_request", "Invalid inquiry request.");
  }
  const name = requireString(record, "name", 1, 40);
  const profession = requireString(record, "profession", 1, 40);
  const contactMethod = requireString(record, "contactMethod", 1, 20);
  const contactValue = requireString(record, "contactValue", 2, 80);
  const needs = requireString(record, "needs", 10, 800);
  if (!professions.has(profession) || !contactMethods.has(contactMethod)) {
    throw new InquiryRequestError(400, "invalid_request", "Invalid inquiry request.");
  }
  if (
    contactMethod === "phone" &&
    !/^(?:\+?86[-\s]?)?1[3-9]\d{9}$/.test(contactValue)
  ) {
    throw new InquiryRequestError(400, "invalid_request", "Invalid inquiry request.");
  }
  if (record.privacyConsent !== true) {
    throw new InquiryRequestError(400, "invalid_request", "Invalid inquiry request.");
  }
  const city =
    record.city === undefined ? undefined : requireString(record, "city", 0, 40);
  return {
    name,
    profession: profession as MainlandLeadRequest["profession"],
    ...(city ? { city } : {}),
    contactMethod: contactMethod as MainlandLeadRequest["contactMethod"],
    contactValue,
    needs,
    privacyConsent: true,
  };
}

async function readBoundedBody(request: Request) {
  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > INQUIRY_MAX_BODY_BYTES) {
        await reader.cancel().catch(() => undefined);
        throw new InquiryRequestError(
          413,
          "payload_too_large",
          "Inquiry payload is too large.",
        );
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

function jsonResponse(
  body: Record<string, unknown>,
  status: number,
  extraHeaders: Record<string, string> = {},
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Cache-Control": PRIVATE_NO_STORE,
      "Content-Type": "application/json; charset=utf-8",
      ...extraHeaders,
    },
  });
}

function successResponse(requestId: string) {
  return jsonResponse(
    { ok: true, message: SUCCESS_MESSAGE, requestId },
    202,
  );
}

function errorResponse(
  requestId: string,
  status: number,
  code: string,
  headers?: Record<string, string>,
) {
  return jsonResponse(
    { ok: false, message: FAILURE_MESSAGE, code, requestId },
    status,
    headers,
  );
}

export function inquiryConfigurationUnavailableResponse(requestId: string) {
  return errorResponse(requestId, 503, "service_unavailable");
}

export function inquiryMethodNotAllowedResponse(requestId: string) {
  return errorResponse(requestId, 405, "method_not_allowed", {
    Allow: "POST",
  });
}

export async function handleInquiryRequest(
  request: Request,
  dependencies: InquiryRequestDependencies,
) {
  const requestId = dependencies.requestIdFactory();
  const startedAt = dependencies.now();
  const record = (
    outcome: InquiryOutcome,
    reason?: string,
  ) => {
    dependencies.telemetry({
      requestId,
      route: "/api/inquiry",
      outcome,
      durationBucket: durationBucket(
        Math.max(0, dependencies.now() - startedAt),
      ),
      ...(reason ? { reason } : {}),
    });
  };

  try {
    const contentLength = request.headers.get("content-length");
    if (contentLength) {
      const declaredLength = Number(contentLength);
      if (
        !Number.isSafeInteger(declaredLength) ||
        declaredLength < 0 ||
        declaredLength > INQUIRY_MAX_BODY_BYTES
      ) {
        throw new InquiryRequestError(
          413,
          "payload_too_large",
          "Inquiry payload is too large.",
        );
      }
    }
    const honeypot = request.headers.get("x-inquiry-honeypot") ?? "";
    if (honeypot.length > MAX_HONEYPOT_LENGTH) {
      throw new InquiryRequestError(
        400,
        "invalid_transport",
        "Invalid inquiry transport.",
      );
    }
    if (honeypot.length > 0) {
      record("honeypot_suppressed");
      return successResponse(requestId);
    }

    const contentType = request.headers.get("content-type") ?? "";
    const mediaType =
      contentType.split(";", 1)[0]?.trim().toLowerCase() ?? "";
    if (mediaType !== "application/json") {
      throw new InquiryRequestError(
        415,
        "unsupported_media_type",
        "Inquiry request must be JSON.",
      );
    }
    const idempotencyKey = request.headers.get("idempotency-key")?.trim() ?? "";
    if (
      idempotencyKey.length < 16 ||
      idempotencyKey.length > 128 ||
      !/^[A-Za-z0-9._:-]+$/.test(idempotencyKey)
    ) {
      throw new InquiryRequestError(
        400,
        "invalid_idempotency_key",
        "Invalid idempotency key.",
      );
    }

    const rawBody = await readBoundedBody(request);
    let input: unknown;
    try {
      input = JSON.parse(rawBody);
    } catch {
      throw new InquiryRequestError(400, "invalid_json", "Invalid JSON.");
    }
    const payload = parseLeadRequest(input);
    const guardResult = dependencies.guard.check(request, idempotencyKey);
    if (guardResult.status === "duplicate") {
      record("duplicate");
      return successResponse(requestId);
    }
    if (guardResult.status === "rate_limited") {
      record("rate_limited", "rate_limit_exceeded");
      return errorResponse(requestId, 429, "rate_limited", {
        "Retry-After": String(guardResult.retryAfterSeconds),
      });
    }

    let delivery;
    try {
      delivery = await dependencies.mailer.send(payload);
    } catch {
      delivery = {
        ok: false as const,
        reason: "directmail_unavailable" as const,
      };
    }
    if (!delivery.ok) {
      record("delivery_unavailable", delivery.reason);
      return errorResponse(requestId, 503, "delivery_unavailable");
    }
    record("accepted");
    return successResponse(requestId);
  } catch (error) {
    if (error instanceof InquiryRequestError) {
      record(
        error.status === 413 ? "payload_rejected" : "validation_rejected",
        error.code,
      );
      return errorResponse(requestId, error.status, error.code);
    }
    record("delivery_unavailable", "internal_error");
    return errorResponse(requestId, 503, "service_unavailable");
  }
}
