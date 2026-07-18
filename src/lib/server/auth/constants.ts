export const SESSION_IDLE_SECONDS = 60 * 60 * 24 * 7;
export const SESSION_ABSOLUTE_SECONDS = 60 * 60 * 24 * 30;
export const OIDC_TRANSACTION_SECONDS = 60 * 10;

export function sessionCookieName(origin: URL): string {
  return origin.protocol === "https:" ? "__Host-publish-session" : "publish-session";
}

export function oidcCookieName(origin: URL): string {
  return origin.protocol === "https:" ? "__Host-publish-oidc" : "publish-oidc";
}

export function safeReturnTo(value: string | null): string {
  if (!value?.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return "/admin";
  }
  return value.startsWith("/admin") || value.startsWith("/preview") ? value : "/admin";
}
