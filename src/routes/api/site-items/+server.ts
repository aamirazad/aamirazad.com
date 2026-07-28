import { error } from "@sveltejs/kit";

import { parseSiteItemInput, validateSiteItemInput } from "$lib/site-content";
import { createSiteItem } from "$lib/server/content/site-items";
import { requireRuntimeEnv } from "$lib/server/env";

import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request, platform, locals }) => {
  const input = parseSiteItemInput(await request.json());
  if (!input || !locals.owner) error(400, "Invalid content data");
  const issue = validateSiteItemInput(input);
  if (issue) error(400, issue);
  const item = await createSiteItem(requireRuntimeEnv(platform), input, locals.owner.subject);
  return Response.json({ item }, { status: 201 });
};
