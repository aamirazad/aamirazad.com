import { dev } from "$app/environment";
import { env as privateEnv } from "$env/dynamic/private";
import { error } from "@sveltejs/kit";

import { Database, neonDriver } from "./db";
import { blobMediaStore, memoryMediaStore, type MediaStore } from "./media";

export type RuntimeEnv = {
  DB: Database;
  MEDIA: MediaStore;
  APP_ORIGIN: string;
  /** `production` or `preview` on Vercel; `local` everywhere else. */
  ENVIRONMENT: "production" | "preview" | "local";
  OIDC_CLIENT_ID: string;
  OIDC_CLIENT_SECRET: string;
  OIDC_DISCOVERY_URL: string;
  OIDC_OWNER_SUB: string;
  SESSION_SECRET: string;
  DEV_AUTH_BYPASS?: string;
};

type SecretKey =
  | "OIDC_CLIENT_ID"
  | "OIDC_CLIENT_SECRET"
  | "OIDC_DISCOVERY_URL"
  | "OIDC_OWNER_SUB"
  | "SESSION_SECRET";

let cached: Promise<RuntimeEnv> | undefined;
let override: RuntimeEnv | undefined;

/** Tests inject an environment backed by an in-memory database. */
export function setRuntimeEnvForTests(next: RuntimeEnv | undefined): void {
  override = next;
}

export async function runtimeEnv(): Promise<RuntimeEnv> {
  if (override) return override;
  cached ??= createRuntimeEnv().catch((cause) => {
    cached = undefined;
    throw cause;
  });
  return cached;
}

async function createRuntimeEnv(): Promise<RuntimeEnv> {
  const environment = deploymentEnvironment(privateEnv);
  const databaseUrl = privateEnv.DATABASE_URL;
  const blobToken = privateEnv.BLOB_READ_WRITE_TOKEN;

  let db: Database;
  if (databaseUrl) {
    db = new Database(neonDriver(databaseUrl));
  } else if (dev) {
    const { pgliteDriver } = await import("./db-local");
    db = new Database(await pgliteDriver(".pglite"));
  } else {
    error(503, "Database configuration is unavailable");
  }

  let media: MediaStore;
  if (blobToken) media = blobMediaStore(blobToken);
  else if (dev) media = memoryMediaStore();
  else error(503, "Media storage configuration is unavailable");

  return {
    DB: db,
    MEDIA: media,
    APP_ORIGIN: privateEnv.APP_ORIGIN || "http://localhost:3000",
    ENVIRONMENT: environment,
    OIDC_CLIENT_ID: privateEnv.OIDC_CLIENT_ID ?? "",
    OIDC_CLIENT_SECRET: privateEnv.OIDC_CLIENT_SECRET ?? "",
    OIDC_DISCOVERY_URL: privateEnv.OIDC_DISCOVERY_URL ?? "",
    OIDC_OWNER_SUB: privateEnv.OIDC_OWNER_SUB ?? "",
    SESSION_SECRET: privateEnv.SESSION_SECRET ?? "",
    DEV_AUTH_BYPASS: privateEnv.DEV_AUTH_BYPASS,
  };
}

export function deploymentEnvironment(
  values: Record<string, string | undefined>,
): RuntimeEnv["ENVIRONMENT"] {
  if (!values.VERCEL) return "local";
  return values.VERCEL_ENV === "production" ? "production" : "preview";
}

export function requireSecret(env: RuntimeEnv, key: SecretKey): string {
  const value = env[key];
  if (typeof value !== "string" || value.length === 0) {
    error(503, `Required server configuration is unavailable: ${String(key)}`);
  }
  return value;
}
