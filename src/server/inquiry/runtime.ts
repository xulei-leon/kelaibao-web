import { randomUUID } from "node:crypto";

import {
  resolveDirectMailConfig,
  resolveInquiryGuardConfig,
} from "@/server/inquiry/config";
import { createDirectMailProvider } from "@/server/inquiry/directmail";
import { InquiryGuard } from "@/server/inquiry/guard";
import type { InquiryRequestDependencies } from "@/server/inquiry/service";
import { emitInquiryTelemetry } from "@/server/inquiry/telemetry";

let runtimeGuard:
  | {
      signature: string;
      guard: InquiryGuard;
    }
  | undefined;

function configuredGuard() {
  const config = resolveInquiryGuardConfig();
  const signature = JSON.stringify(config);
  if (!runtimeGuard || runtimeGuard.signature !== signature) {
    runtimeGuard = {
      signature,
      guard: new InquiryGuard({ ...config, now: Date.now }),
    };
  }
  return runtimeGuard.guard;
}

export function createRuntimeInquiryDependencies(): InquiryRequestDependencies {
  return {
    guard: configuredGuard(),
    mailer: createDirectMailProvider(resolveDirectMailConfig()),
    requestIdFactory: randomUUID,
    telemetry: emitInquiryTelemetry,
    now: Date.now,
  };
}
