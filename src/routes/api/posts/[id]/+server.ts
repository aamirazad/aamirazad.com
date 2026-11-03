import { error } from "@sveltejs/kit";

import { parseDraftInput, validateDraft } from "$lib/content";
import { purgePostPaths } from "$lib/server/cache-purge";
import { deletePost, updateDraft } from "$lib/server/content/posts";
import { runtimeEnv } from "$lib/server/env";

import type { RequestHandler } from "./$types";

export const PATCH: RequestHandler = async ({ request, params, locals }) => {
  const input = parseDraftInput(await request.json());
  if (!input || !locals.owner) error(400, "Invalid draft data");
  const issues = validateDraft(input);
  const result = await updateDraft(await runtimeEnv(), params.id, input);
  if (result === "conflict") {
    return Response.json(
      { message: "This draft changed in another tab. Reload before saving." },
      { status: 409 },
    );
  }
  if (!result) error(404, "Post not found");
  return Response.json({ post: result, issues });
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
  if (!locals.owner) error(401, "Unauthorized");
  const result = await deletePost(await runtimeEnv(), params.id, locals.owner.subject);
  if (!result) error(404, "Post not found");
  await purgePostPaths(result.purgePaths);
  return new Response(null, { status: 204 });
};
