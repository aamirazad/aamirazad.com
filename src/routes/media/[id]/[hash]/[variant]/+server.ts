import { error } from "@sveltejs/kit";

import { requireRuntimeEnv } from "$lib/server/env";

import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ params, platform }) => {
  const env = requireRuntimeEnv(platform);
  const variant = await env.DB.prepare(
    `SELECT v.r2_key, v.mime_type FROM asset_variants v JOIN assets a ON a.id = v.asset_id
    WHERE v.asset_id = ? AND v.variant = ? AND v.content_hash = ? AND a.deleted_at IS NULL LIMIT 1`,
  )
    .bind(params.id, params.variant, params.hash)
    .first<{ r2_key: string; mime_type: string }>();
  if (!variant) error(404, "Image not found");
  const object = await env.MEDIA.get(variant.r2_key);
  if (!object) error(404, "Image not found");
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("content-type", variant.mime_type);
  headers.set("etag", object.httpEtag);
  headers.set("last-modified", object.uploaded.toUTCString());
  return new Response(object.body, { headers });
};

export const HEAD = GET;
