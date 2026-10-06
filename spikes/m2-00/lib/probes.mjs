import { evaluateCostGate } from "./gate-model.mjs";

const EVIDENCE_PATH = "docs/5-Evidence/m2-00/gate-report.md";
const SENSITIVE_DATA_CHECK =
  "Only allowlisted booleans and non-sensitive runtime labels are recorded; credentials, cookies, response bodies, and PII are excluded.";

function evidence({
  id,
  title,
  verifiedAt,
  resource,
  execution,
  expected,
  actual,
  status,
  nextAction,
}) {
  return {
    id,
    title,
    verifiedAt,
    isolatedResource: resource || "Missing isolated resource configuration.",
    execution,
    expected,
    actual,
    evidencePath: EVIDENCE_PATH,
    sensitiveDataCheck: SENSITIVE_DATA_CHECK,
    status,
    nextAction,
  };
}

function blocked(id, title, verifiedAt, missing, expected) {
  return evidence({
    id,
    title,
    verifiedAt,
    resource: "Missing isolated resource configuration.",
    execution: "Preflight validation; no network request was sent.",
    expected,
    actual: `Missing required configuration: ${missing.join(", ")}.`,
    status: "BLOCKED",
    nextAction: `Provide ${missing.join(", ")} using isolated Alibaba Cloud resources and rerun.`,
  });
}

function missingFields(value, fields) {
  return fields.filter((field) => {
    const current = value?.[field];
    return current === undefined || current === null || String(current).trim() === "";
  });
}

function isHttps(value) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function commonProbeFields(config) {
  return missingFields(config, ["isolatedOrigin", "probeIdentity"]);
}

function isAllowedProbeUrl(config, value) {
  if (!isHttps(value) || !isHttps(config?.isolatedOrigin)) {
    return false;
  }
  try {
    return new URL(value).origin === new URL(config.isolatedOrigin).origin;
  } catch {
    return false;
  }
}

function probeIdentityMatches(config, body) {
  return (
    typeof config?.probeIdentity === "string" &&
    body?.probeIdentity === config.probeIdentity
  );
}

function requestHeaders(config, env) {
  const tokenName = config?.probeTokenEnv || "M2_00_PROBE_TOKEN";
  const token = env?.[tokenName];
  return token ? { authorization: `Bearer ${token}` } : {};
}

function probeFailure(id, title, verifiedAt, resource, execution, expected) {
  return evidence({
    id,
    title,
    verifiedAt,
    resource,
    execution,
    expected,
    actual:
      "The direct HTTPS probe failed or returned a response outside the required allowlisted contract.",
    status: "BLOCKED",
    nextAction:
      "Inspect the isolated provider-side logs, correct the chain, and rerun without copying raw responses into the repository.",
  });
}

async function probeEsaFc(config, context) {
  const title = "ESA origin to Function Compute";
  const required = [
    ...commonProbeFields(config),
    ...missingFields(config?.esaFc, ["originProbeUrl"]),
  ];
  if (required.length || !context.fetchImpl) {
    return blocked("G1", title, context.verifiedAt, required.length ? required : ["fetch runtime"], "ESA must preserve Host, HTTPS, and client address information while using FC as the origin.");
  }
  if (!isAllowedProbeUrl(config, config.esaFc.originProbeUrl)) {
    return blocked("G1", title, context.verifiedAt, ["same-origin HTTPS originProbeUrl"], "The probe must use the configured isolated HTTPS origin.");
  }

  try {
    const response = await context.fetchImpl(config.esaFc.originProbeUrl, {
      headers: requestHeaders(config, context.env),
      redirect: "error",
    });
    const body = response.ok ? await response.json() : {};
    const summary = {
      probeIdentity: probeIdentityMatches(config, body),
      hostPreserved: body.hostPreserved === true,
      httpsDetected: body.httpsDetected === true,
      clientAddressPresent: body.clientAddressPresent === true,
      esaOrigin: body.esaOrigin === true,
    };
    const pass = response.ok && Object.values(summary).every(Boolean);
    return evidence({
      id: "G1",
      title,
      verifiedAt: context.verifiedAt,
      resource: `${config.region || "unknown-region"} ESA/FC isolated probe`,
      execution: "Direct HTTPS GET to the ESA-backed origin probe.",
      expected: "hostPreserved, httpsDetected, clientAddressPresent, and esaOrigin are all true.",
      actual: JSON.stringify(summary),
      status: pass ? "PASS" : "BLOCKED",
      nextAction: pass ? "None." : "Correct ESA forwarding/origin settings and rerun.",
    });
  } catch {
    return probeFailure("G1", title, context.verifiedAt, `${config.region || "unknown-region"} ESA/FC isolated probe`, "Direct HTTPS GET to the ESA-backed origin probe.", "ESA forwards to FC with the required proxy information.");
  }
}

async function probeFcNext(config, context) {
  const title = "Function Compute Next.js runtime";
  const required = [
    ...commonProbeFields(config),
    ...missingFields(config?.fcNext, [
      "ssrUrl",
      "ssrMarker",
      "routeHandlerUrl",
      "streamUrl",
    ]),
  ];
  if (required.length || !context.fetchImpl) {
    return blocked("G2", title, context.verifiedAt, required.length ? required : ["fetch runtime"], "FC must run Next.js SSR, Route Handlers, and streaming/non-streaming responses.");
  }
  const urls = [
    config.fcNext.ssrUrl,
    config.fcNext.routeHandlerUrl,
    config.fcNext.streamUrl,
  ];
  if (urls.some((url) => !isAllowedProbeUrl(config, url))) {
    return blocked("G2", title, context.verifiedAt, ["same-origin HTTPS FC probe URLs"], "All FC probes must use the configured isolated HTTPS origin.");
  }

  try {
    const headers = requestHeaders(config, context.env);
    const [ssr, route, stream] = await Promise.all([
      context.fetchImpl(config.fcNext.ssrUrl, { headers, redirect: "error" }),
      context.fetchImpl(config.fcNext.routeHandlerUrl, { headers, redirect: "error" }),
      context.fetchImpl(config.fcNext.streamUrl, { headers, redirect: "error" }),
    ]);
    const ssrText = ssr.ok ? await ssr.text() : "";
    const routeBody = route.ok ? await route.json() : {};
    const streamText = stream.ok ? await stream.text() : "";
    const summary = {
      probeIdentity: probeIdentityMatches(config, routeBody),
      ssrMarkerPresent: ssrText.includes(config.fcNext.ssrMarker),
      routeHandler: routeBody.routeHandler === true,
      nonStreaming: routeBody.nonStreaming === true,
      nodeVersionRecorded: typeof routeBody.nodeVersion === "string" && routeBody.nodeVersion.length > 0,
      verifiedDeliveryShape:
        routeBody.deliveryShape === "fc-standalone-verified",
      streaming: stream.ok && streamText.includes("m2-stream-complete"),
    };
    const pass = ssr.ok && route.ok && Object.values(summary).every(Boolean);
    return evidence({
      id: "G2",
      title,
      verifiedAt: context.verifiedAt,
      resource: `${config.region || "unknown-region"} FC isolated Next.js spike`,
      execution: "Three direct HTTPS GET requests for SSR, Route Handler, and streaming output.",
      expected: "All Next.js capability checks succeed and runtime/delivery labels are recorded.",
      actual: JSON.stringify(summary),
      status: pass ? "PASS" : "BLOCKED",
      nextAction: pass ? "None." : "Fix the FC delivery/runtime configuration and rerun.",
    });
  } catch {
    return probeFailure("G2", title, context.verifiedAt, `${config.region || "unknown-region"} FC isolated Next.js spike`, "Direct HTTPS SSR/Route Handler/stream probes.", "All Next.js capability probes pass.");
  }
}

async function probeRds(config, context) {
  const title = "Function Compute private VPC to RDS MySQL";
  const required = [
    ...commonProbeFields(config),
    ...missingFields(config?.rds, ["probeUrl"]),
  ];
  if (required.length || !context.fetchImpl) {
    return blocked("G3", title, context.verifiedAt, required.length ? required : ["fetch runtime"], "An FC-hosted probe must prove private VPC connectivity, SELECT 1, bounded connection reuse, and no public RDS endpoint.");
  }
  if (!isAllowedProbeUrl(config, config.rds.probeUrl)) {
    return blocked("G3", title, context.verifiedAt, ["same-origin HTTPS rds.probeUrl"], "The RDS probe must use the configured isolated HTTPS origin.");
  }

  try {
    const response = await context.fetchImpl(config.rds.probeUrl, {
      headers: requestHeaders(config, context.env),
      redirect: "error",
    });
    const body = response.ok ? await response.json() : {};
    const summary = {
      probeIdentity: probeIdentityMatches(config, body),
      privateVpc: body.privateVpc === true,
      selectOne: body.selectOne === true,
      connectionReuse: body.connectionReuse === true,
      publicEndpointDisabled: body.publicEndpointDisabled === true,
    };
    const pass = response.ok && Object.values(summary).every(Boolean);
    return evidence({
      id: "G3",
      title,
      verifiedAt: context.verifiedAt,
      resource: `${config.region || "unknown-region"} FC/VPC/RDS isolated probe`,
      execution: "Direct HTTPS GET to the FC-hosted, provider-specific RDS probe.",
      expected: "Private VPC query and bounded connection reuse pass; public endpoint is disabled.",
      actual: JSON.stringify(summary),
      status: pass ? "PASS" : "BLOCKED",
      nextAction: pass ? "None." : "Correct VPC/RDS networking or connection handling and rerun.",
    });
  } catch {
    return probeFailure("G3", title, context.verifiedAt, `${config.region || "unknown-region"} FC/VPC/RDS isolated probe`, "Direct HTTPS GET to the FC-hosted RDS probe.", "Private RDS query and connection reuse succeed.");
  }
}

async function probeOss(config, context) {
  const title = "Private OSS upload and ESA distribution";
  const required = [
    ...commonProbeFields(config),
    ...missingFields(config?.oss, ["securityProbeUrl"]),
  ];
  if (required.length || !context.fetchImpl) {
    return blocked("G4", title, context.verifiedAt, required.length ? required : ["fetch runtime"], "Private Bucket, rejected direct read, controlled ESA origin, expiring upload, cross-key rejection, and no long-term browser credentials.");
  }
  if (!isAllowedProbeUrl(config, config.oss.securityProbeUrl)) {
    return blocked("G4", title, context.verifiedAt, ["same-origin HTTPS oss.securityProbeUrl"], "The OSS probe must use the configured isolated HTTPS origin.");
  }

  try {
    const response = await context.fetchImpl(config.oss.securityProbeUrl, {
      headers: requestHeaders(config, context.env),
      redirect: "error",
    });
    const body = response.ok ? await response.json() : {};
    const summary = {
      probeIdentity: probeIdentityMatches(config, body),
      bucketPrivate: body.bucketPrivate === true,
      directReadRejected: body.directReadRejected === true,
      esaReadSucceeded: body.esaReadSucceeded === true,
      controlledOrigin: body.controlledOrigin === true,
      shortLivedUpload: body.shortLivedUpload === true,
      expiredRejected: body.expiredRejected === true,
      crossKeyRejected: body.crossKeyRejected === true,
      noLongTermCredentials: body.noLongTermCredentials === true,
    };
    const pass = response.ok && Object.values(summary).every(Boolean);
    return evidence({
      id: "G4",
      title,
      verifiedAt: context.verifiedAt,
      resource: `${config.region || "unknown-region"} OSS/ESA isolated probe`,
      execution: "Direct HTTPS GET to the provider-specific OSS/ESA security probe.",
      expected: "All private-origin and short-lived authorization checks pass.",
      actual: JSON.stringify(summary),
      status: pass ? "PASS" : "BLOCKED",
      nextAction: pass ? "None." : "Correct OSS policy, origin authorization, or upload restrictions and rerun.",
    });
  } catch {
    return probeFailure("G4", title, context.verifiedAt, `${config.region || "unknown-region"} OSS/ESA isolated probe`, "Direct HTTPS GET to the OSS/ESA security probe.", "All private-origin and upload authorization checks pass.");
  }
}

async function probeSession(config, context) {
  const title = "Same-domain session cookie through ESA";
  const required = [
    ...commonProbeFields(config),
    ...missingFields(config?.session, ["setUrl", "echoUrl"]),
  ];
  if (required.length || !context.fetchImpl) {
    return blocked("G5", title, context.verifiedAt, required.length ? required : ["fetch runtime"], "A Secure, HttpOnly, SameSite=Strict cookie must round-trip through ESA to FC.");
  }
  if (
    ![config.session.setUrl, config.session.echoUrl].every((url) =>
      isAllowedProbeUrl(config, url),
    )
  ) {
    return blocked("G5", title, context.verifiedAt, ["same-origin HTTPS session URLs"], "Cookie probes must use the configured isolated HTTPS origin.");
  }

  try {
    const headers = requestHeaders(config, context.env);
    const setResponse = await context.fetchImpl(config.session.setUrl, {
      headers,
      redirect: "error",
    });
    const setCookies =
      typeof setResponse.headers?.getSetCookie === "function"
        ? setResponse.headers.getSetCookie()
        : [setResponse.headers?.get?.("set-cookie")].filter(Boolean);
    const cookie = setCookies[0] || "";
    const cookiePair = cookie.split(";")[0];
    const echoResponse = await context.fetchImpl(config.session.echoUrl, {
      headers: { ...headers, cookie: cookiePair },
      redirect: "error",
    });
    const body = echoResponse.ok ? await echoResponse.json() : {};
    const summary = {
      probeIdentity: probeIdentityMatches(config, body),
      secure: /;\s*Secure\b/i.test(cookie),
      httpOnly: /;\s*HttpOnly\b/i.test(cookie),
      sameSiteStrict: /;\s*SameSite=Strict\b/i.test(cookie),
      roundTrip: body.roundTrip === true,
    };
    const pass = setResponse.ok && echoResponse.ok && Object.values(summary).every(Boolean);
    return evidence({
      id: "G5",
      title,
      verifiedAt: context.verifiedAt,
      resource: `${config.region || "unknown-region"} ESA/FC cookie probe`,
      execution: "Two direct HTTPS requests; the cookie value is used in memory and never recorded.",
      expected: "Secure, HttpOnly, SameSite=Strict, and roundTrip are all true.",
      actual: JSON.stringify(summary),
      status: pass ? "PASS" : "BLOCKED",
      nextAction: pass ? "None." : "Correct the cookie or ESA forwarding behavior and rerun.",
    });
  } catch {
    return probeFailure("G5", title, context.verifiedAt, `${config.region || "unknown-region"} ESA/FC cookie probe`, "Direct HTTPS set/echo cookie requests.", "The protected cookie round-trips through ESA.");
  }
}

async function probeDirectMail(config, context) {
  const title = "DirectMail controlled test delivery";
  const required = [
    ...commonProbeFields(config),
    ...missingFields(config?.directMail, ["probeUrl"]),
  ];
  if (required.length || !context.fetchImpl) {
    return blocked("G6", title, context.verifiedAt, required.length ? required : ["fetch runtime"], "A provider-specific HTTPS call must deliver through an approved test domain without logging PII.");
  }
  if (!isAllowedProbeUrl(config, config.directMail.probeUrl)) {
    return blocked("G6", title, context.verifiedAt, ["same-origin HTTPS directMail.probeUrl"], "The DirectMail probe must use the configured isolated HTTPS origin.");
  }

  try {
    const response = await context.fetchImpl(config.directMail.probeUrl, {
      method: "POST",
      headers: requestHeaders(config, context.env),
      redirect: "error",
    });
    const body = response.ok ? await response.json() : {};
    const summary = {
      probeIdentity: probeIdentityMatches(config, body),
      providerDirectMail: body.provider === "DirectMail",
      httpsApi: body.httpsApi === true,
      testDomain: body.testDomain === true,
      delivered: body.delivered === true,
      noPiiLogs: body.noPiiLogs === true,
    };
    const pass = response.ok && Object.values(summary).every(Boolean);
    return evidence({
      id: "G6",
      title,
      verifiedAt: context.verifiedAt,
      resource: `${config.region || "unknown-region"} DirectMail isolated probe`,
      execution: "Direct HTTPS POST to the provider-specific DirectMail probe.",
      expected: "DirectMail test-domain delivery succeeds and no PII is logged.",
      actual: JSON.stringify(summary),
      status: pass ? "PASS" : "BLOCKED",
      nextAction: pass ? "None." : "Correct DirectMail domain/API configuration and rerun.",
    });
  } catch {
    return probeFailure("G6", title, context.verifiedAt, `${config.region || "unknown-region"} DirectMail isolated probe`, "Direct HTTPS POST to the DirectMail probe.", "Controlled test delivery succeeds.");
  }
}

async function probeEsaPurge(config, context) {
  const title = "ESA exact URL purge";
  const required = [
    ...commonProbeFields(config),
    ...missingFields(config?.esaPurge, ["probeUrl"]),
  ];
  if (required.length || !context.fetchImpl) {
    return blocked("G7", title, context.verifiedAt, required.length ? required : ["fetch runtime"], "A provider-specific HTTPS purge must invalidate only the recorded exact URLs.");
  }
  if (!isAllowedProbeUrl(config, config.esaPurge.probeUrl)) {
    return blocked("G7", title, context.verifiedAt, ["same-origin HTTPS esaPurge.probeUrl"], "The ESA purge probe must use the configured isolated HTTPS origin.");
  }

  try {
    const response = await context.fetchImpl(config.esaPurge.probeUrl, {
      method: "POST",
      headers: requestHeaders(config, context.env),
      redirect: "error",
    });
    const body = response.ok ? await response.json() : {};
    const summary = {
      probeIdentity: probeIdentityMatches(config, body),
      exactUrls: body.exactUrls === true,
      purgeAccepted: body.purgeAccepted === true,
      refreshedObserved: body.refreshedObserved === true,
      unrelatedUrlUnchanged: body.unrelatedUrlUnchanged === true,
    };
    const pass = response.ok && Object.values(summary).every(Boolean);
    return evidence({
      id: "G7",
      title,
      verifiedAt: context.verifiedAt,
      resource: `${config.region || "unknown-region"} ESA purge isolated probe`,
      execution: "Direct HTTPS POST to the provider-specific ESA exact-purge probe.",
      expected: "Exact URLs refresh while an unrelated control URL remains unchanged.",
      actual: JSON.stringify(summary),
      status: pass ? "PASS" : "BLOCKED",
      nextAction: pass ? "None." : "Correct ESA purge authorization or URL selection and rerun.",
    });
  } catch {
    return probeFailure("G7", title, context.verifiedAt, `${config.region || "unknown-region"} ESA purge isolated probe`, "Direct HTTPS POST to the ESA purge probe.", "Exact URL invalidation is observed.");
  }
}

function probeCost(config, context) {
  const title = "Versioned resource cost";
  const result = evaluateCostGate(config?.cost);
  return evidence({
    id: "G8",
    title,
    verifiedAt: context.verifiedAt,
    resource: `${config?.region || "unknown-region"} development/test/production candidate pricing`,
    execution: "Offline comparison of a versioned real quote against a versioned hard limit.",
    expected: result.expected,
    actual: result.actual,
    status: result.status,
    nextAction: result.nextAction,
  });
}

export async function runM200Gates(
  config = {},
  {
    fetchImpl = globalThis.fetch,
    env = process.env,
    now = () => new Date().toISOString(),
  } = {},
) {
  const context = { fetchImpl, env, verifiedAt: now() };
  const gates = await Promise.all([
    probeEsaFc(config, context),
    probeFcNext(config, context),
    probeRds(config, context),
    probeOss(config, context),
    probeSession(config, context),
    probeDirectMail(config, context),
    probeEsaPurge(config, context),
  ]);
  gates.push(probeCost(config, context));
  return gates;
}
