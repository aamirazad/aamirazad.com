import { error } from "@sveltejs/kit";

import { parseSiteItemInput, validateSiteItemInput } from "$lib/site-content";
import { deleteSiteItem, updateSiteItem } from "$lib/server/content/site-items";
import { requireRuntimeEnv } from "$lib/server/env";

import type { RequestHandler } from "./$types";

export const PATCH: RequestHandler = async ({ request, params, platform, locals }) => {
  const input = parseSiteItemInput(await request.json());
  if (!input || input.version === undefined || !locals.owner) error(400, "Invalid content data");
  const issue = validateSiteItemInput(input);
  if (issue) error(400, issue);
  const result = await updateSiteItem(
    requireRuntimeEnv(platform),
    params.id,
    { ...input, version: input.version },
    locals.owner.subject,
  );
  if (result === "conflict") {
    return Response.json(
      { error: "conflict", message: "This item changed in another session." },
      { status: 409 },
    );
  }
  if (!result) error(404, "Content item not found");
  return Response.json({ item: result });
};

export const DELETE: RequestHandler = async ({ params, platform, locals }) => {
  if (!locals.owner) error(401, "Unauthorized");
  const deleted = await deleteSiteItem(
    requireRuntimeEnv(platform),
    params.id,
    locals.owner.subject,
  );
  if (!deleted) error(404, "Content item not found");
  return new Response(null, { status: 204 });
};
