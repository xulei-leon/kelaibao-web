const MAX_CONTENT_REQUEST_CHARACTERS = 510_000;

export function parseContentType(value: unknown) {
  if (value !== "news" && value !== "case") {
    throw new Error("Content type must be news or case.");
  }
  return value;
}

export async function readContentJson(request: Request) {
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (
    (Number.isFinite(declaredLength) &&
      declaredLength > MAX_CONTENT_REQUEST_CHARACTERS * 4) ||
    declaredLength < 0
  ) {
    throw new Error("Content request is too large.");
  }
  const source = await request.text();
  if (source.length > MAX_CONTENT_REQUEST_CHARACTERS) {
    throw new Error("Content request is too large.");
  }
  let value: unknown;
  try {
    value = JSON.parse(source);
  } catch {
    throw new Error("Content request must be valid JSON.");
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Content request must be an object.");
  }
  return value as Record<string, unknown>;
}

export function contentApiError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (/administrator authentication required/i.test(message)) {
    return {
      status: 401,
      code: "authentication_required",
      message: "Administrator authentication required.",
    };
  }
  if (/origin|host|csrf|trusted mutation/i.test(message)) {
    return {
      status: 403,
      code: "request_rejected",
      message: "Administrator request rejected.",
    };
  }
  if (/content_not_found|content item id is invalid/i.test(message)) {
    return {
      status: 404,
      code: "not_found",
      message: "Content item was not found.",
    };
  }
  if (/duplicate_slug/i.test(message)) {
    return {
      status: 409,
      code: "duplicate_slug",
      message: "The slug is already used by this content type.",
    };
  }
  if (/content_version_conflict|content version conflict/i.test(message)) {
    return {
      status: 409,
      code: "version_conflict",
      message: "Content changed on the server. Reload and compare before retrying.",
    };
  }
  if (/authorization confirmation is required/i.test(message)) {
    return {
      status: 422,
      code: "authorization_required",
      message: "Case authorization confirmation is required before first publication.",
    };
  }
  if (/transition|immutable/i.test(message)) {
    return {
      status: 409,
      code: "invalid_transition",
      message: "The requested content state transition is not allowed.",
    };
  }
  if (
    /must|required|invalid|publishable|too large|valid json|unconfirmed media|not confirmed for public representative use|cover media|cover alt|outside the confirmed origin|media origin/i.test(
      message,
    )
  ) {
    return {
      status: 400,
      code: "validation_error",
      message: "Content input did not pass validation.",
    };
  }
  return {
    status: 500,
    code: "internal_error",
    message: "Content operation is temporarily unavailable.",
  };
}

export function contentInput(body: Record<string, unknown>, contentType?: unknown) {
  return {
    contentType: contentType ?? body.contentType,
    slug: body.slug,
    title: body.title,
    summary: body.summary,
    sourceHtml: body.sourceHtml,
    coverMediaAssetId: body.coverMediaAssetId,
    coverAlt: body.coverAlt,
  };
}
