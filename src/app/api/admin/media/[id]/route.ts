import { NextResponse } from "next/server";
import { authenticateAdminSession } from "@/server/auth/request";
import { createMediaUploadRepository } from "@/server/db/repository-factory";
import { mediaDisplayDto, mediaFailureResponse } from "@/server/media/admin-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    if (!await authenticateAdminSession(request)) throw new Error("Administrator authentication required.");
    const raw = (await context.params).id;
    const id = Number(raw);
    if (!/^[1-9][0-9]*$/.test(raw) || !Number.isSafeInteger(id)) throw new Error("Invalid media id.");
    const asset = await createMediaUploadRepository().findById(id);
    if (!asset) throw new Error("Media asset not found.");
    return NextResponse.json({ ok: true, asset: mediaDisplayDto(asset) }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return mediaFailureResponse(error);
  }
}
