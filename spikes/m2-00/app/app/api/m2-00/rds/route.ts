import { connect } from "node:net";

import {
  authorizeProbe,
  getProbeIdentity,
  unauthorizedProbeResponse,
  unconfiguredProbeResponse,
} from "../../../../lib/probe-auth";

export const dynamic = "force-dynamic";

function databaseConfig() {
  const config = {
    host: process.env.M2_RDS_HOST,
    port: Number(process.env.M2_RDS_PORT ?? "3306"),
  };
  const missing = Object.entries(config)
    .filter(([, value]) => !value)
    .map(([key]) => key);
  return { config, missing };
}

function verifyMySqlHandshake(host: string, port: number) {
  return new Promise<boolean>((resolve) => {
    const socket = connect({ host, port });
    let settled = false;

    const finish = (result: boolean) => {
      if (settled) {
        return;
      }
      settled = true;
      socket.destroy();
      resolve(result);
    };

    socket.setTimeout(5_000);
    socket.once("data", (packet) => {
      const protocolVersion = packet.length > 4 ? packet[4] : 0;
      finish(protocolVersion === 10);
    });
    socket.once("timeout", () => finish(false));
    socket.once("error", () => finish(false));
    socket.once("end", () => finish(false));
  });
}

export async function GET(request: Request) {
  if (!authorizeProbe(request)) {
    return unauthorizedProbeResponse();
  }

  const { config, missing } = databaseConfig();
  if (
    missing.length ||
    process.env.M2_RDS_PRIVATE_VPC !== "true" ||
    process.env.M2_RDS_PUBLIC_ENDPOINT_DISABLED !== "true"
  ) {
    return unconfiguredProbeResponse("RDS", [
      ...missing,
      "M2_RDS_PRIVATE_VPC=true",
      "M2_RDS_PUBLIC_ENDPOINT_DISABLED=true",
    ]);
  }

  const handshake = await verifyMySqlHandshake(config.host!, config.port);

  return Response.json(
    {
      probeIdentity: getProbeIdentity(),
      privateVpc: handshake,
      selectOne: false,
      connectionReuse: false,
      publicEndpointDisabled: true,
    },
    { headers: { "cache-control": "no-store" } },
  );
}
