import { NextResponse } from "next/server";

import { resolveSiteUrl } from "@/lib/site-config";
import {
  requestIdFromRequest,
  requireAdminMutation,
} from "@/server/auth/request";
import {
  contentApiError,
  readContentJson,
} from "@/server/content/admin-api";
import { createContentRepository } from "@/server/db/repository-factory";
import { attemptPostCommitPurge } from "@/server/content/purge-runtime";
import {
  offlineContent,
  parseExpectedVersion,
  parseItemId,
} from "@/server/content/service";
import { redactServerError } from "@/server/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const requestId = requestIdFromRequest(request);
  try {
    const session = await requireAdminMutation(request);
    const body = await readContentJson(request);
    const result = await offlineContent({
      itemId: parseItemId((await context.params).id),
      expectedVersion: parseExpectedVersion(body.expectedVersion),
      actorAdminId: session.adminId,
      repository: createContentRepository(),
      requestId,
      publicOrigin: resolveSiteUrl(),
    });
    if (result.purgeJobId === null) {
      throw new Error("Offlined content did not create a purge job.");
    }
    const purge = await attemptPostCommitPurge(
      result.purgeJobId,
      `${requestId}-purge`,
    );
    return NextResponse.json({ ok: true, ...result, purge, requestId });
  } catch (error) {
    const failure = contentApiError(error);
    console.error(
      `Content offline rejected [${requestId}]: ${redactServerError(error)}`,
    );
    return NextResponse.json(
      { ok: false, code: failure.code, message: failure.message, requestId },
      { status: failure.status },
    );
  }
}
