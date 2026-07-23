import { error } from "@sveltejs/kit";

import { parseDraftInput, validateDraft } from "$lib/content";
import { updateDraft } from "$lib/server/content/posts";
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
