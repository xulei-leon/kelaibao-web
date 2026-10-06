import { NextResponse } from "next/server";

import { createAuthRepository } from "@/server/db/repository-factory";
import {
  requestIdFromRequest,
  requireAdminMutation,
} from "@/server/auth/request";
import { redactServerError } from "@/server/config";
import {
  sanitizeAdminHtml,
} from "@/server/security/html/sanitizer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const requestId = requestIdFromRequest(request);
  const repository = createAuthRepository();
  try {
    const session = await requireAdminMutation(request, repository);
    const body = (await request.json()) as { source?: unknown };
    if (typeof body.source !== "string" || body.source.length > 500_000) {
      return NextResponse.json(
        { ok: false, message: "HTML source is invalid.", requestId },
        { status: 400 },
      );
    }
    const result = sanitizeAdminHtml(body.source);
    await repository.recordSecurityAudit({
      action: "html_sanitized",
      actorAdminId: session.adminId,
      requestId,
      metadata: {
        policyVersion: result.policyVersion,
        changed: result.diagnostics.changed,
        diagnosticCount: result.diagnostics.codes.length,
      },
    });
    return NextResponse.json({ ok: true, ...result, requestId });
  } catch (error) {
    console.error(`HTML sanitization rejected [${requestId}]: ${redactServerError(error)}`);
    return NextResponse.json(
      { ok: false, message: "HTML sanitization rejected.", requestId },
      { status: 401 },
    );
  }
}
