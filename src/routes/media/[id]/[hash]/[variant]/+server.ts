import { error } from "@sveltejs/kit";

import { requireRuntimeEnv } from "$lib/server/env";
import { readManifest } from "$lib/server/public-content";

import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ params, platform }) => {
  const env = requireRuntimeEnv(platform);
  const variant = (await readManifest(env))?.media[params.id]?.variants?.[params.variant];
  if (!variant || variant.contentHash !== params.hash) error(404, "Image not found");
  const object = await env.MEDIA.get(variant.r2Key);
  if (!object) error(404, "Image not found");
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("content-type", variant.mimeType);
  headers.set("etag", object.httpEtag);
  headers.set("last-modified", object.uploaded.toUTCString());
  return new Response(object.body, { headers });
};

export const HEAD = GET;
