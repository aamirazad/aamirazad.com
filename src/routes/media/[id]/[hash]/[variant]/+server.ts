import { error } from "@sveltejs/kit";

import { runtimeEnv } from "$lib/server/env";

import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ params }) => {
  const env = await runtimeEnv();
  const variant = await env.DB.first<{ storage_key: string; mime_type: string }>(
    `SELECT v.storage_key, v.mime_type FROM aamirazad_asset_variants v
    JOIN aamirazad_assets a ON a.id = v.asset_id
    WHERE v.asset_id = $1 AND v.variant = $2 AND v.content_hash = $3 AND a.deleted_at IS NULL
    LIMIT 1`,
    params.id,
    params.variant,
    params.hash,
  );
  if (!variant) error(404, "Image not found");
  const object = await env.MEDIA.get(variant.storage_key);
  if (!object) error(404, "Image not found");
  return new Response(object.body, {
    headers: {
      "content-type": variant.mime_type,
      etag: object.etag,
      "last-modified": object.uploadedAt.toUTCString(),
    },
  });
};

export const HEAD = GET;
