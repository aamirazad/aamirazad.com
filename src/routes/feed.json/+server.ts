import { jsonFeed } from "$lib/server/content/feeds";
import { listPublishedPosts } from "$lib/server/public-content";
import { requireRuntimeEnv } from "$lib/server/env";

import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ platform }) => {
  const env = requireRuntimeEnv(platform);
  return new Response(jsonFeed(env.APP_ORIGIN, await listPublishedPosts(env, 20)), {
    headers: { "content-type": "application/feed+json; charset=utf-8" },
  });
};
export const HEAD = GET;
