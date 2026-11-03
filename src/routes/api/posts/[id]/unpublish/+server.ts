import { error } from "@sveltejs/kit";

import { purgePostPaths } from "$lib/server/cache-purge";
import { unpublishPost } from "$lib/server/content/publish";
import { runtimeEnv } from "$lib/server/env";

import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ params, locals }) => {
  if (!locals.owner) error(401, "Unauthorized");
  const result = await unpublishPost(await runtimeEnv(), params.id, locals.owner.subject);
  if (!result) error(404, "Post not found");
  await purgePostPaths(result.purgePaths);
  return Response.json({ post: result.post });
};
