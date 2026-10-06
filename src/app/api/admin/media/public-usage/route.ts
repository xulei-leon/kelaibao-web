import { NextResponse } from "next/server";
import { mediaFailureResponse } from "@/server/media/admin-api";

import { requestIdFromRequest, requireAdminMutation } from "@/server/auth/request";
import { redactServerError } from "@/server/config";
import { createMediaUploadRepository } from "@/server/db/repository-factory";
import { confirmMediaPublicUsage } from "@/server/media/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const requestId = requestIdFromRequest(request);
  try {
    const session = await requireAdminMutation(request);
    const body = (await request.json()) as { mediaAssetId?: unknown };
    const asset = await confirmMediaPublicUsage({
      mediaAssetId: Number(body.mediaAssetId),
      adminId: session.adminId,
      repository: createMediaUploadRepository(),
      requestId,
    });
    return NextResponse.json({
      ok: true,
      asset: {
        id: asset.id,
        width: asset.width,
        height: asset.height,
        publicUsageConfirmedAt: asset.publicUsageConfirmedAt,
      },
      requestId,
    });
  } catch (error) {
    console.error(
      `Media public usage confirmation rejected [${requestId}]: ${redactServerError(error)}`,
    );
    return mediaFailureResponse(error, requestId);
  }
}
