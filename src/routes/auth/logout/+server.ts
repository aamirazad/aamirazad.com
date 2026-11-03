import { redirect, type RequestHandler } from "@sveltejs/kit";

import { revokeSession } from "$lib/server/auth/sessions";
import { runtimeEnv } from "$lib/server/env";

export const POST: RequestHandler = async ({ cookies, url }) => {
  const env = await runtimeEnv();
  await revokeSession(env, cookies, url);
  redirect(303, "/");
};
