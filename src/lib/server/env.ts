import { error } from "@sveltejs/kit";

export type RuntimeEnv = Env;

export function requireRuntimeEnv(platform: App.Platform | undefined): RuntimeEnv {
  if (!platform?.env) {
    error(503, "Cloudflare bindings are unavailable");
  }
  return platform.env;
}

export function requireSecret(env: RuntimeEnv, key: keyof RuntimeEnv): string {
  const value = env[key];
  if (typeof value !== "string" || value.length === 0) {
    error(503, `Required server configuration is unavailable: ${String(key)}`);
  }
  return value;
}
