import assert from "node:assert/strict";
import test from "node:test";

import { runM200Gates } from "../lib/probes.mjs";

test("runM200Gates returns eight explicit BLOCKED records when config is absent", async () => {
  const gates = await runM200Gates({}, { fetchImpl: null });

  assert.equal(gates.length, 8);
  assert.deepEqual(
    gates.map((gate) => gate.id),
    ["G1", "G2", "G3", "G4", "G5", "G6", "G7", "G8"],
  );
  assert.ok(gates.every((gate) => gate.status === "BLOCKED"));
  assert.ok(gates.every((gate) => gate.actual.includes("Missing")));
});

test("the cost gate can pass independently but does not make the overall cloud chain pass", async () => {
  const gates = await runM200Gates(
    {
      cost: {
        currency: "CNY",
        trafficAssumptions: "10k visits/month",
        quoteCapturedAt: "2026-07-29T00:00:00.000Z",
        quoteSource: "Alibaba Cloud calculator",
        monthlyHardLimit: 800,
        estimatedMonthlyTotal: 500,
      },
    },
    { fetchImpl: null },
  );

  assert.equal(gates.find((gate) => gate.id === "G8")?.status, "PASS");
  assert.ok(
    gates
      .filter((gate) => gate.id !== "G8")
      .every((gate) => gate.status === "BLOCKED"),
  );
});

test("probe response details are reduced to an allowlisted summary", async () => {
  const fetchImpl = async () => ({
    ok: true,
    json: async () => ({
      probeIdentity: "m2-fc-deployment-001",
      hostPreserved: true,
      httpsDetected: true,
      clientAddressPresent: true,
      esaOrigin: true,
      AccessKeySecret: "must-not-appear",
    }),
  });

  const gates = await runM200Gates(
    {
      region: "cn-shenzhen",
      isolatedOrigin: "https://probe.example.test",
      probeIdentity: "m2-fc-deployment-001",
      esaFc: {
        originProbeUrl: "https://probe.example.test/api/m2-00/origin",
      },
    },
    { fetchImpl },
  );
  const gate = gates.find((item) => item.id === "G1");

  assert.equal(gate.status, "PASS");
  assert.doesNotMatch(JSON.stringify(gate), /must-not-appear/);
});

test("a probe URL outside the configured isolated origin is blocked before fetch", async () => {
  let fetchCalled = false;
  const gates = await runM200Gates(
    {
      isolatedOrigin: "https://trusted.example.test",
      probeIdentity: "m2-fc-deployment-001",
      rds: {
        probeUrl: "https://spoofed.example.test/api/m2-00/rds",
      },
    },
    {
      fetchImpl: async () => {
        fetchCalled = true;
        throw new Error("must not fetch");
      },
    },
  );

  assert.equal(gates.find((gate) => gate.id === "G3")?.status, "BLOCKED");
  assert.equal(fetchCalled, false);
});

test("G2 rejects an explicitly unverified delivery shape", async () => {
  const fetchImpl = async (url) => {
    if (url.endsWith("/")) {
      return { ok: true, text: async () => "m2-00-next-ssr-marker" };
    }
    if (url.endsWith("/runtime")) {
      return {
        ok: true,
        json: async () => ({
          probeIdentity: "m2-fc-deployment-001",
          routeHandler: true,
          nonStreaming: true,
          nodeVersion: "v20.19.0",
          deliveryShape: "standalone-candidate-unverified",
        }),
      };
    }
    return { ok: true, text: async () => "m2-stream-complete" };
  };

  const gates = await runM200Gates(
    {
      isolatedOrigin: "https://probe.example.test",
      probeIdentity: "m2-fc-deployment-001",
      fcNext: {
        ssrUrl: "https://probe.example.test/",
        ssrMarker: "m2-00-next-ssr-marker",
        routeHandlerUrl: "https://probe.example.test/api/m2-00/runtime",
        streamUrl: "https://probe.example.test/api/m2-00/stream",
      },
    },
    { fetchImpl },
  );

  const gate = gates.find((item) => item.id === "G2");
  assert.equal(gate.status, "BLOCKED");
  assert.match(gate.actual, /verifiedDeliveryShape.*false/);
});
