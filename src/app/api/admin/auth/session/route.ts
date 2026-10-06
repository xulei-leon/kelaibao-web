import { NextResponse } from "next/server";

import { createAuthRepository } from "@/server/db/repository-factory";
import {
  authenticateAdminSession,
  requestIdFromRequest,
  sessionTokenFromRequest,
} from "@/server/auth/request";
import {
  deriveCsrfCredentials,
  resolveCsrfDerivationSecret,
  tokenMatchesHash,
} from "@/server/auth/session";
import { redactServerError } from "@/server/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = requestIdFromRequest(request);
  try {
    const repository = createAuthRepository();
    const session = await authenticateAdminSession(request, repository);
    if (!session) {
      return NextResponse.json(
        { ok: false, message: "Administrator authentication required.", requestId },
        { status: 401 },
      );
    }
    const sessionToken = sessionTokenFromRequest(request);
    if (!sessionToken) {
      throw new Error("Authenticated session token is unavailable.");
    }
    const csrf = deriveCsrfCredentials(
      sessionToken,
      resolveCsrfDerivationSecret(),
    );
    if (!tokenMatchesHash(csrf.csrfToken, session.csrfTokenHash)) {
      throw new Error("Session CSRF binding is invalid.");
    }
    return NextResponse.json({
      ok: true,
      username: session.username,
      csrfToken: csrf.csrfToken,
      expiresAt: session.expiresAt.toISOString(),
      requestId,
    });
  } catch (error) {
    console.error(`Admin session unavailable [${requestId}]: ${redactServerError(error)}`);
    return NextResponse.json(
      { ok: false, message: "Administrator session unavailable.", requestId },
      { status: 503 },
    );
  }
}
