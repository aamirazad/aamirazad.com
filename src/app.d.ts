/// <reference path="../worker-configuration.d.ts" />

import type { OwnerSession } from "$lib/server/auth/sessions";

declare global {
  namespace App {
    interface Locals {
      owner: OwnerSession | null;
    }

    interface Platform {
      env: Env;
      ctx: ExecutionContext;
      caches: CacheStorage;
      cf?: IncomingRequestCfProperties;
    }
  }
}

export {};
