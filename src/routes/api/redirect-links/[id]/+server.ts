import { error } from "@sveltejs/kit";

import { parseRedirectLinkInput, validateRedirectLinkInput } from "$lib/redirect-links";
import { deleteRedirectLink, updateRedirectLink } from "$lib/server/content/redirect-links";
import { requireRuntimeEnv } from "$lib/server/env";

import type { RequestHandler } from "./$types";

export const PATCH: RequestHandler = async ({ request, params, platform, locals }) => {
  const input = parseRedirectLinkInput(await request.json());
  if (!input || input.version === undefined || !locals.owner) error(400, "Invalid redirect data");
  const issue = validateRedirectLinkInput(input);
  if (issue) error(400, issue);
  const result = await updateRedirectLink(
    requireRuntimeEnv(platform),
    params.id,
    { ...input, version: input.version },
    locals.owner.subject,
  );
  if (result === "conflict") {
    return Response.json({ message: "This redirect changed in another session." }, { status: 409 });
  }
  if (result === "path_taken") {
    return Response.json({ message: "That short path is already in use." }, { status: 409 });
  }
  if (!result) error(404, "Redirect link not found");
  return Response.json({ link: result });
};

export const DELETE: RequestHandler = async ({ params, platform, locals }) => {
  if (!locals.owner) error(401, "Unauthorized");
  const deleted = await deleteRedirectLink(
    requireRuntimeEnv(platform),
    params.id,
    locals.owner.subject,
  );
  if (!deleted) error(404, "Redirect link not found");
  return new Response(null, { status: 204 });
};
