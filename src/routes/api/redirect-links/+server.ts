import { error } from "@sveltejs/kit";

import { parseRedirectLinkInput, validateRedirectLinkInput } from "$lib/redirect-links";
import { createRedirectLink } from "$lib/server/content/redirect-links";
import { requireRuntimeEnv } from "$lib/server/env";

import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request, platform, locals }) => {
  const input = parseRedirectLinkInput(await request.json());
  if (!input || !locals.owner) error(400, "Invalid redirect data");
  const issue = validateRedirectLinkInput(input);
  if (issue) error(400, issue);
  const link = await createRedirectLink(requireRuntimeEnv(platform), input, locals.owner.subject);
  if (link === "path_taken") {
    return Response.json({ message: "That short path is already in use." }, { status: 409 });
  }
  return Response.json({ link }, { status: 201 });
};
