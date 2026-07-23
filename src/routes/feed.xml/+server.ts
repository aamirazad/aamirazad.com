import { atomFeed } from "$lib/server/content/projection";
import { readGeneratedObject } from "$lib/server/public-content";
import { requireRuntimeEnv } from "$lib/server/env";
import type { RequestHandler } from "./$types";
export const GET: RequestHandler = async ({ platform }) => {
  const env = requireRuntimeEnv(platform);
  const object = await readGeneratedObject(env, "feeds/feed.xml");
  return new Response(object?.body ?? atomFeed(env.APP_ORIGIN, []), {
    headers: {
      "content-type": "application/atom+xml; charset=utf-8",
      ...(object
        ? { etag: object.httpEtag, "last-modified": object.uploaded.toUTCString() }
        : { "last-modified": new Date(0).toUTCString() }),
    },
  });
};
export const HEAD = GET;
