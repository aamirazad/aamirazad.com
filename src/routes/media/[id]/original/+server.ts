import { error } from "@sveltejs/kit";
import { readManifest } from "$lib/server/public-content";
import { requireRuntimeEnv } from "$lib/server/env";
import type { RequestHandler } from "./$types";
export const GET: RequestHandler = async ({ params, platform }) => {
  const env = requireRuntimeEnv(platform);
  const manifest = await readManifest(env);
  const media = manifest?.media[params.id];
  if (!media) error(404, "Image not found");
  const object = await env.MEDIA.get(media.originalKey);
  if (!object) error(404, "Image not found");
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("content-type", media.mimeType);
  headers.set("etag", object.httpEtag);
  return new Response(object.body, { headers });
};
export const HEAD = GET;
