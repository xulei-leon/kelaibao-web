import { NextResponse } from "next/server";

import {
  authenticateAdmin,
  GENERIC_LOGIN_FAILURE,
} from "@/server/auth/service";
import { createAuthRepository } from "@/server/db/repository-factory";
import {
  hashAdminPassword,
  needsAdminPasswordRehash,
  verifyAdminPassword,
} from "@/server/auth/password";
import {
  createSessionCookie,
  resolveCsrfDerivationSecret,
} from "@/server/auth/session";
import { requestIdFromRequest } from "@/server/auth/request";
import { redactServerError } from "@/server/config";
import { resolveSiteUrl } from "@/lib/site-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const requestId = requestIdFromRequest(request);
  try {
    const body = (await request.json()) as {
      username?: unknown;
      password?: unknown;
    };
    const username = typeof body.username === "string" ? body.username : "";
    const password = typeof body.password === "string" ? body.password : "";
    const dummyPasswordHash = process.env.ADMIN_DUMMY_PASSWORD_HASH?.trim();
    if (!dummyPasswordHash?.startsWith("$argon2id$")) {
      throw new Error("ADMIN_DUMMY_PASSWORD_HASH is not configured.");
    }

    const result = await authenticateAdmin({
      username,
      password,
      repository: createAuthRepository(),
      passwordHasher: {
        verify: verifyAdminPassword,
        needsRehash: needsAdminPasswordRehash,
        hash: hashAdminPassword,
      },
      dummyPasswordHash,
      csrfSecret: resolveCsrfDerivationSecret(),
      requestId,
    });
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, message: GENERIC_LOGIN_FAILURE, requestId },
        { status: result.status },
      );
    }

    const response = NextResponse.json({
      ok: true,
      csrfToken: result.csrfToken,
      expiresAt: result.expiresAt.toISOString(),
      requestId,
    });
    response.headers.set(
      "Set-Cookie",
      createSessionCookie(
        result.sessionToken,
        result.expiresAt,
        new URL(resolveSiteUrl()).protocol === "https:",
      ),
    );
    return response;
  } catch (error) {
    console.error(`Admin login unavailable [${requestId}]: ${redactServerError(error)}`);
    return NextResponse.json(
      { ok: false, message: GENERIC_LOGIN_FAILURE, requestId },
      { status: 503 },
    );
  }
}
