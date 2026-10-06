import { NextResponse } from "next/server";
import { mediaFailureResponse } from "@/server/media/admin-api";

import {
  requestIdFromRequest,
  requireAdminMutation,
} from "@/server/auth/request";
import { redactServerError } from "@/server/config";
import {
  createOssPutAuthorizer,
  resolveOssStsConfig,
} from "@/server/integrations/oss/provider";
import {
  createMediaUploadIntent,
} from "@/server/media/service";
import { createMediaUploadRepository } from "@/server/db/repository-factory";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const requestId = requestIdFromRequest(request);
  try {
    const session = await requireAdminMutation(request);
    const input = (await request.json()) as {
      fileName?: unknown;
      mimeType?: unknown;
      byteSize?: unknown;
      sha256?: unknown;
    };
    const repository = createMediaUploadRepository();
    const result = await createMediaUploadIntent({
      adminId: session.adminId,
      input: {
        fileName: typeof input.fileName === "string" ? input.fileName : "",
        mimeType: typeof input.mimeType === "string" ? input.mimeType : "",
        byteSize: Number(input.byteSize),
        sha256: typeof input.sha256 === "string" ? input.sha256 : "",
      },
      repository,
      authorizePut: createOssPutAuthorizer(resolveOssStsConfig()),
      requestId,
    });
    return NextResponse.json({
      ok: true,
      intentId: result.intent.id,
      authorization: result.authorization,
      requestId,
      evidenceStatus: "LOCAL_CONTRACT_ONLY_M2_LEGACY_01_DEFERRED",
    });
  } catch (error) {
    console.error(`Media presign rejected [${requestId}]: ${redactServerError(error)}`);
    return mediaFailureResponse(error, requestId);
  }
}
