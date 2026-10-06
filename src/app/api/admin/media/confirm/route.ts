import { NextResponse } from "next/server";
import { mediaFailureResponse } from "@/server/media/admin-api";

import {
  requestIdFromRequest,
  requireAdminMutation,
} from "@/server/auth/request";
import { redactServerError } from "@/server/config";
import {
  DirectHttpsOssProvider,
  publicAssetUrl,
  resolveOssStsConfig,
} from "@/server/integrations/oss/provider";
import {
  confirmMediaUpload,
} from "@/server/media/service";
import { createMediaUploadRepository } from "@/server/db/repository-factory";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const requestId = requestIdFromRequest(request);
  try {
    const session = await requireAdminMutation(request);
    const body = (await request.json()) as { intentId?: unknown };
    if (typeof body.intentId !== "string" || body.intentId.length > 64) {
      return NextResponse.json(
        { ok: false, message: "Upload intent is invalid.", requestId },
        { status: 400 },
      );
    }
    const ossConfig = resolveOssStsConfig();
    const asset = await confirmMediaUpload({
      adminId: session.adminId,
      intentId: body.intentId,
      repository: createMediaUploadRepository(),
      provider: new DirectHttpsOssProvider(ossConfig),
      requestId,
    });
    return NextResponse.json({
      ok: true,
      asset: {
        ...asset,
        publicUrl: publicAssetUrl(ossConfig, asset.objectKey),
      },
      requestId,
      evidenceStatus: "LOCAL_CONTRACT_ONLY_M2_LEGACY_01_DEFERRED",
    });
  } catch (error) {
    console.error(`Media confirmation rejected [${requestId}]: ${redactServerError(error)}`);
    return mediaFailureResponse(error, requestId);
  }
}
