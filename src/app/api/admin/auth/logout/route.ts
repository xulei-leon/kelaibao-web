import { NextResponse } from "next/server";

import { createAuthRepository } from "@/server/db/repository-factory";
import {
  requestIdFromRequest,
  requireAdminMutation,
} from "@/server/auth/request";
import { clearSessionCookie } from "@/server/auth/session";
import { redactServerError } from "@/server/config";
import { resolveSiteUrl } from "@/lib/site-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const requestId = requestIdFromRequest(request);
  const repository = createAuthRepository();
  try {
    const session = await requireAdminMutation(request, repository);
    await repository.revokeSession(session, requestId);
    const response = NextResponse.json({ ok: true, requestId });
    response.headers.set(
      "Set-Cookie",
      clearSessionCookie(new URL(resolveSiteUrl()).protocol === "https:"),
    );
    return response;
  } catch (error) {
    console.error(`Admin logout rejected [${requestId}]: ${redactServerError(error)}`);
    return NextResponse.json(
      { ok: false, message: "Administrator logout rejected.", requestId },
      { status: 401 },
    );
  }
}
