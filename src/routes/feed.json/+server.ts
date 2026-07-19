import { error } from "@sveltejs/kit";
import { readGeneratedObject } from "$lib/server/public-content";
import { requireRuntimeEnv } from "$lib/server/env";
import type { RequestHandler } from "./$types";
export const GET: RequestHandler = async ({ platform }) => {
  const object = await readGeneratedObject(requireRuntimeEnv(platform), "feeds/feed.json");
  if (!object) error(404, "Feed not generated");
  return new Response(object.body, {
    headers: { "content-type": "application/feed+json; charset=utf-8" },
  });
};
