import { NextResponse } from "next/server";

import { resolveSiteUrl } from "@/lib/site-config";
import {
  authenticateAdminSession,
  requestIdFromRequest,
  requireAdminMutation,
} from "@/server/auth/request";
import {
  contentApiError,
  contentInput,
  readContentJson,
} from "@/server/content/admin-api";
import {
  createAuthRepository,
  createContentRepository,
} from "@/server/db/repository-factory";
import {
  parseExpectedVersion,
  parseItemId,
  saveContentDraft,
} from "@/server/content/service";
import { redactServerError } from "@/server/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const requestId = requestIdFromRequest(request);
  try {
    const session = await authenticateAdminSession(
      request,
      createAuthRepository(),
    );
    if (!session) throw new Error("Administrator authentication required.");
    const itemId = parseItemId((await context.params).id);
    const result = await createContentRepository().getAdminItem(itemId);
    if (!result) throw new Error("content_not_found");
    return NextResponse.json({ ok: true, ...result, requestId });
  } catch (error) {
    const failure = contentApiError(error);
    console.error(
      `Content detail rejected [${requestId}]: ${redactServerError(error)}`,
    );
    return NextResponse.json(
      { ok: false, code: failure.code, message: failure.message, requestId },
      { status: failure.status },
    );
  }
}

export async function PUT(request: Request, context: RouteContext) {
  const requestId = requestIdFromRequest(request);
  try {
    const session = await requireAdminMutation(request);
    const body = await readContentJson(request);
    const result = await saveContentDraft({
      itemId: parseItemId((await context.params).id),
      expectedVersion: parseExpectedVersion(body.expectedVersion),
      input: contentInput(body),
      actorAdminId: session.adminId,
      repository: createContentRepository(),
      requestId,
      publicOrigin: resolveSiteUrl(),
    });
    return NextResponse.json({ ok: true, ...result, requestId });
  } catch (error) {
    const failure = contentApiError(error);
    console.error(
      `Content save rejected [${requestId}]: ${redactServerError(error)}`,
    );
    return NextResponse.json(
      { ok: false, code: failure.code, message: failure.message, requestId },
      { status: failure.status },
    );
  }
}
