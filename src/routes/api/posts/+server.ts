import { error } from "@sveltejs/kit";

import { parseDraftInput, validateDraft } from "$lib/content";
import { createMeaningfulDraft, hasMeaningfulInput } from "$lib/server/content/posts";
import { requireRuntimeEnv } from "$lib/server/env";

import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request, platform, locals }) => {
  const input = parseDraftInput(await request.json());
  if (!input || !locals.owner || !hasMeaningfulInput(input)) error(400, "Add something first");
  const issues = validateDraft(input);
  const post = await createMeaningfulDraft(
    requireRuntimeEnv(platform),
    input,
    locals.owner.subject,
  );
  return Response.json({ post, issues }, { status: 201 });
};
