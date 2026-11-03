import { Database } from "../../src/lib/server/db";
import { pgliteDriver } from "../../src/lib/server/db-local";
import type { RuntimeEnv } from "../../src/lib/server/env";
import { memoryMediaStore } from "../../src/lib/server/media";

/** A fresh, fully migrated in-memory database and media store for each test. */
export async function createTestEnv(): Promise<RuntimeEnv> {
  return {
    DB: new Database(await pgliteDriver()),
    MEDIA: memoryMediaStore(),
    APP_ORIGIN: "https://aamirazad.com",
    ENVIRONMENT: "preview",
    OIDC_CLIENT_ID: "",
    OIDC_CLIENT_SECRET: "",
    OIDC_DISCOVERY_URL: "",
    OIDC_OWNER_SUB: "",
    SESSION_SECRET: "test-session-secret",
  };
}
