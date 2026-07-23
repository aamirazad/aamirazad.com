import { error } from "@sveltejs/kit";

import { parseDraftInput } from "$lib/content";
import { enqueuePublication } from "$lib/server/content/publish";
import { updateDraft } from "$lib/server/content/posts";
import { requireRuntimeEnv } from "$lib/server/env";

import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request, params, platform, locals }) => {
  const input = parseDraftInput(await request.json());
  if (!input || !locals.owner) error(400, "Invalid draft data");
  const env = requireRuntimeEnv(platform);
  const saved = await updateDraft(env, params.id, input);
  if (saved === "conflict") {
    return Response.json(
      { error: "conflict", message: "This draft changed in another session." },
      { status: 409 },
    );
  }
  if (!saved) error(404, "Post not found");
  const result = await enqueuePublication(env, params.id, locals.owner.subject);
  if (result.issues.length) {
    return Response.json({ issues: result.issues, post: saved }, { status: 400 });
  }
  return Response.json({ jobId: result.jobId, post: saved });
};
