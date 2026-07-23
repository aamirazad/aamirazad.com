import { redirect, type RequestHandler } from "@sveltejs/kit";

import { revokeSession } from "$lib/server/auth/sessions";
import { requireRuntimeEnv } from "$lib/server/env";

export const POST: RequestHandler = async ({ cookies, platform, url }) => {
  const env = requireRuntimeEnv(platform);
  await revokeSession(env, cookies, url);
  redirect(303, "/");
};
