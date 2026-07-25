import { error } from "@sveltejs/kit";

import { parseDraftInput, validateDraft } from "$lib/content";
import { enqueueArchive } from "$lib/server/content/publish";
import { deletePost, updateDraft } from "$lib/server/content/posts";
import { requireRuntimeEnv } from "$lib/server/env";

import type { RequestHandler } from "./$types";

export const PATCH: RequestHandler = async ({ request, params, platform, locals }) => {
  const input = parseDraftInput(await request.json());
  if (!input || !locals.owner) error(400, "Invalid draft data");
  const issues = validateDraft(input);
  const result = await updateDraft(requireRuntimeEnv(platform), params.id, input);
  if (result === "conflict") {
    return Response.json(
      { error: "conflict", message: "This draft changed in another session." },
      { status: 409 },
    );
  }
  if (!result) error(404, "Post not found");
  return Response.json({ post: result, issues });
};

export const DELETE: RequestHandler = async ({ params, platform, locals }) => {
  if (!locals.owner) error(401, "Unauthorized");
  const env = requireRuntimeEnv(platform);
  const result = await deletePost(env, params.id, locals.owner.subject);
  if (!result) error(404, "Post not found");
  if (result === "busy") {
    return Response.json(
      { message: "Wait for the current publishing operation to finish, then try again." },
      { status: 409 },
    );
  }
  if (result === "must-archive") {
    const jobId = await enqueueArchive(env, params.id, locals.owner.subject);
    return Response.json({ jobId, message: "Removing the published post first." }, { status: 202 });
  }
  return new Response(null, { status: 204 });
};
