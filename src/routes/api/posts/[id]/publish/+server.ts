import { error } from "@sveltejs/kit";

import { parseDraftInput } from "$lib/content";
import { purgePostPaths } from "$lib/server/cache-purge";
import { publishPost } from "$lib/server/content/publish";
import { updateDraft } from "$lib/server/content/posts";
import { requireRuntimeEnv } from "$lib/server/env";

import type { RequestHandler } from "./$types";

/** Save the submitted draft and publish it in one request. */
export const POST: RequestHandler = async ({ request, params, platform, locals }) => {
  const input = parseDraftInput(await request.json());
  if (!input || !locals.owner) error(400, "Invalid draft data");
  const env = requireRuntimeEnv(platform);
  const saved = await updateDraft(env, params.id, input);
  if (saved === "conflict") {
    return Response.json(
      { message: "This draft changed in another tab. Reload before publishing." },
      { status: 409 },
    );
  }
  if (!saved) error(404, "Post not found");
  const result = await publishPost(env, params.id, locals.owner.subject);
  if (!result) error(404, "Post not found");
  if (!result.ok) {
    return Response.json({ post: saved, issues: result.issues }, { status: 400 });
  }
  await purgePostPaths(platform, result.purgePaths);
  return Response.json({ post: result.post });
};
