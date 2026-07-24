export function normalizeWorkersDevRequestProtocol(request: Request): Request {
  const url = new URL(request.url);
  if (
    url.protocol !== "http:" ||
    !url.hostname.endsWith(".workers.dev") ||
    !externalRequestUsedHttps(request.headers)
  ) {
    return request;
  }

  url.protocol = "https:";
  return new Request(url, request);
}

function externalRequestUsedHttps(headers: Headers): boolean {
  if (headers.get("x-forwarded-proto")?.trim().toLowerCase() === "https") {
    return true;
  }

  const visitor = headers.get("cf-visitor");
  if (!visitor) return false;

  try {
    const parsed: unknown = JSON.parse(visitor);
    return (
      typeof parsed === "object" &&
      parsed !== null &&
      "scheme" in parsed &&
      typeof parsed.scheme === "string" &&
      parsed.scheme.toLowerCase() === "https"
    );
  } catch {
    return false;
  }
}
