import { NextResponse } from "next/server";

import {
  authenticateAdminSession,
  requestIdFromRequest,
  requireAdminMutation,
} from "@/server/auth/request";
import {
  contentApiError,
  contentInput,
  parseContentType,
  readContentJson,
} from "@/server/content/admin-api";
import {
  createAuthRepository,
  createContentRepository,
} from "@/server/db/repository-factory";
import { createContentDraft } from "@/server/content/service";
import { redactServerError } from "@/server/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = requestIdFromRequest(request);
  try {
    const session = await authenticateAdminSession(
      request,
      createAuthRepository(),
    );
    if (!session) throw new Error("Administrator authentication required.");
    const contentType = parseContentType(
      new URL(request.url).searchParams.get("type"),
    );
    const items = await createContentRepository().listByType(contentType);
    return NextResponse.json({ ok: true, items, requestId });
  } catch (error) {
    const failure = contentApiError(error);
    console.error(
      `Content list rejected [${requestId}]: ${redactServerError(error)}`,
    );
    return NextResponse.json(
      { ok: false, code: failure.code, message: failure.message, requestId },
      { status: failure.status },
    );
  }
}

export async function POST(request: Request) {
  const requestId = requestIdFromRequest(request);
  try {
    const session = await requireAdminMutation(request);
    const body = await readContentJson(request);
    const result = await createContentDraft({
      input: contentInput(body),
      actorAdminId: session.adminId,
      repository: createContentRepository(),
      requestId,
    });
    return NextResponse.json(
      { ok: true, ...result, requestId },
      { status: 201 },
    );
  } catch (error) {
    const failure = contentApiError(error);
    console.error(
      `Content create rejected [${requestId}]: ${redactServerError(error)}`,
    );
    return NextResponse.json(
      { ok: false, code: failure.code, message: failure.message, requestId },
      { status: failure.status },
    );
  }
}
