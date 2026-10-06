import { NextResponse } from "next/server";

import {
  authenticateAdminSession,
  requestIdFromRequest,
} from "@/server/auth/request";
import { contentApiError } from "@/server/content/admin-api";
import {
  createAuthRepository,
  createContentRepository,
} from "@/server/db/repository-factory";
import { parseItemId } from "@/server/content/service";
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
    const repository = createContentRepository();
    if (!(await repository.getAdminItem(itemId))) {
      throw new Error("content_not_found");
    }
    const revisions = await repository.listRevisions(itemId);
    return NextResponse.json({ ok: true, revisions, requestId });
  } catch (error) {
    const failure = contentApiError(error);
    console.error(
      `Content revisions rejected [${requestId}]: ${redactServerError(error)}`,
    );
    return NextResponse.json(
      { ok: false, code: failure.code, message: failure.message, requestId },
      { status: failure.status },
    );
  }
}
