export function canonicalRedirect(
  requestUrl: string,
  appOrigin: string,
  environment: string,
): string | null {
  if (environment !== "production") return null;
  const incoming = new URL(requestUrl);
  const canonical = new URL(appOrigin);
  if (incoming.hostname === canonical.hostname) return null;
  return new URL(`${incoming.pathname}${incoming.search}`, canonical).href;
}
