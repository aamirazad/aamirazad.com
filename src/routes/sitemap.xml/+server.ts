import { sitemap } from "$lib/server/content/projection";
import { readGeneratedObject } from "$lib/server/public-content";
import { requireRuntimeEnv } from "$lib/server/env";
import type { RequestHandler } from "./$types";
export const GET: RequestHandler = async ({ platform }) => {
  const env = requireRuntimeEnv(platform);
  const object = await readGeneratedObject(env, "sitemap.xml");
  return new Response(object?.body ?? sitemap(env.APP_ORIGIN, []), {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      ...(object
        ? { etag: object.httpEtag, "last-modified": object.uploaded.toUTCString() }
        : { "last-modified": new Date(0).toUTCString() }),
    },
  });
};
export const HEAD = GET;
