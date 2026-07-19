import { error } from "@sveltejs/kit";
import { readGeneratedObject } from "$lib/server/public-content";
import { requireRuntimeEnv } from "$lib/server/env";
import type { RequestHandler } from "./$types";
export const GET: RequestHandler = async ({ platform }) => {
  const object = await readGeneratedObject(requireRuntimeEnv(platform), "feeds/feed.xml");
  if (!object) error(404, "Feed not generated");
  return new Response(object.body, {
    headers: {
      "content-type": "application/atom+xml; charset=utf-8",
      etag: object.httpEtag,
      "last-modified": object.uploaded.toUTCString(),
    },
  });
};
export const HEAD = GET;
