import type { OwnerSession } from "./sessions";

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

/**
 * Local development cannot complete the OIDC flow, so `DEV_AUTH_BYPASS=true` signs every
 * loopback request in as the owner. It is ignored unless Wrangler is running the local
 * environment; preview and production set ENVIRONMENT explicitly.
 */
export function devBypassOwner(
  env: { ENVIRONMENT: string; DEV_AUTH_BYPASS?: string },
  url: URL,
): OwnerSession | null {
  if (env.ENVIRONMENT !== "local" || env.DEV_AUTH_BYPASS !== "true") return null;
  if (!LOOPBACK_HOSTS.has(url.hostname)) return null;
  return {
    issuer: "local",
    subject: "local-dev",
    absoluteExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1_000).toISOString(),
  };
}
