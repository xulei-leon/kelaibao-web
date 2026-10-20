import { resolveApplicationConfig } from "@/server/config";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const headers = { "cache-control": "private, no-store, max-age=0" };

export async function GET() {
  try {
    const config = resolveApplicationConfig();
    return Response.json(
      {
        status: "ok",
        runtimeMode: config.runtimeMode,
        version: config.appVersion,
        contentSource: config.contentSource,
        externalLegacy: ["M2-LEGACY-01", "M2-LEGACY-02"],
      },
      { headers },
    );
  } catch {
    return Response.json(
      {
        status: "degraded",
        contentSource: "static",
        externalLegacy: ["M2-LEGACY-01", "M2-LEGACY-02"],
      },
      { status: 503, headers },
    );
  }
}
