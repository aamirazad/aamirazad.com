import { error } from "@sveltejs/kit";

import { uploadPostAssetForMarkdown } from "$lib/server/content/assets";
import { requireRuntimeEnv } from "$lib/server/env";

import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request, params, platform, locals }) => {
  if (!locals.owner) error(401, "Unauthorized");
  const data = await request.formData();
  const image = data.get("image");
  if (!(image instanceof File)) error(400, "Choose an image.");
  try {
    const result = await uploadPostAssetForMarkdown(
      requireRuntimeEnv(platform),
      params.id,
      image,
      locals.owner.subject,
    );
    return Response.json(result, { status: 201 });
  } catch (caught) {
    error(400, caught instanceof Error ? caught.message : "Image upload failed.");
  }
};
