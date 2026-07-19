import { error } from "@sveltejs/kit";
import { readGeneratedObject } from "$lib/server/public-content";
import { requireRuntimeEnv } from "$lib/server/env";
import type { RequestHandler } from "./$types";
export const GET: RequestHandler = async ({ platform }) => {
  const object = await readGeneratedObject(requireRuntimeEnv(platform), "sitemap.xml");
  if (!object) error(404, "Sitemap not generated");
  return new Response(object.body, {
    headers: { "content-type": "application/xml; charset=utf-8" },
  });
};
