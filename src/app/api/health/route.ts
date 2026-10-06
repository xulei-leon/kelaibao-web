import { resolveServerConfig } from "@/server/config";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const headers = { "cache-control": "private, no-store, max-age=0" };

export async function GET() {
  try {
    const config = resolveServerConfig();
    return Response.json(
      {
        status: "ok",
        runtimeMode: config.runtimeMode,
        version: config.appVersion,
        database: { configured: Boolean(config.database) },
        externalLegacy: ["M2-LEGACY-01", "M2-LEGACY-02"],
      },
      { headers },
    );
  } catch {
    return Response.json(
      {
        status: "degraded",
        database: { configured: false },
        externalLegacy: ["M2-LEGACY-01", "M2-LEGACY-02"],
      },
      { status: 503, headers },
    );
  }
}
