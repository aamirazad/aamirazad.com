import { error } from "@sveltejs/kit";

import { hmacHex } from "$lib/server/crypto";
import type { RuntimeEnv } from "$lib/server/env";

export async function enforceRateLimit(
  env: RuntimeEnv,
  identifier: string,
  action: string,
  limit: number,
  windowSeconds: number,
  now = new Date(),
): Promise<void> {
  const keyHash = await hmacHex(env.SESSION_SECRET, identifier);
  const windowStart = new Date(
    Math.floor(now.getTime() / (windowSeconds * 1000)) * windowSeconds * 1000,
  ).toISOString();

  const row = await env.DB.prepare(
    `INSERT INTO rate_limits (key_hash, action, window_started_at, count)
      VALUES (?, ?, ?, 1)
      ON CONFLICT (key_hash, action) DO UPDATE SET
        count = CASE
          WHEN window_started_at = excluded.window_started_at THEN count + 1
          ELSE 1
        END,
        window_started_at = excluded.window_started_at
      RETURNING count`,
  )
    .bind(keyHash, action, windowStart)
    .first<{ count: number }>();

  if (!row || row.count > limit) {
    error(429, "Too many requests");
  }
}
