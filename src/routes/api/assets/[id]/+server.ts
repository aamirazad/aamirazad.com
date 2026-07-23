import { error } from "@sveltejs/kit";

import { getAssetObject } from "$lib/server/content/assets";
import { requireRuntimeEnv } from "$lib/server/env";

import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ params, platform, request }) => {
  const object = await getAssetObject(requireRuntimeEnv(platform), params.id);
  if (!object) error(404, "Image not found");
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", "private, no-store");
  return new Response(request.method === "HEAD" ? null : object.body, { headers });
};

export const HEAD = GET;
