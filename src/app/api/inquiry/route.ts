import { randomUUID } from "node:crypto";

import { createRuntimeInquiryDependencies } from "@/server/inquiry/runtime";
import {
  handleInquiryRequest,
  inquiryConfigurationUnavailableResponse,
  inquiryMethodNotAllowedResponse,
} from "@/server/inquiry/service";
import { emitInquiryTelemetry } from "@/server/inquiry/telemetry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function methodNotAllowed(_request: Request) {
  const requestId = randomUUID();
  emitInquiryTelemetry({
    requestId,
    route: "/api/inquiry",
    outcome: "validation_rejected",
    durationBucket: "lt_250ms",
    reason: "method_not_allowed",
  });
  return inquiryMethodNotAllowedResponse(requestId);
}

export const GET = methodNotAllowed;
export const HEAD = methodNotAllowed;
export const PUT = methodNotAllowed;
export const PATCH = methodNotAllowed;
export const DELETE = methodNotAllowed;
export const OPTIONS = methodNotAllowed;

export async function POST(request: Request) {
  try {
    return await handleInquiryRequest(
      request,
      createRuntimeInquiryDependencies(),
    );
  } catch {
    const requestId = randomUUID();
    emitInquiryTelemetry({
      requestId,
      route: "/api/inquiry",
      outcome: "configuration_unavailable",
      durationBucket: "lt_250ms",
      reason: "configuration_unavailable",
    });
    return inquiryConfigurationUnavailableResponse(requestId);
  }
}
