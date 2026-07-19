import { error, redirect } from "@sveltejs/kit";

import { isSeries } from "$lib/content";
import { readPublishedPost } from "$lib/server/public-content";
import { requireRuntimeEnv } from "$lib/server/env";

import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params, platform, url }) => {
  if (!isSeries(params.series)) error(404, "Post not found");
  const result = await readPublishedPost(requireRuntimeEnv(platform), url.pathname);
  if (!result) error(404, "Post not found");
  if ("redirect" in result) redirect(308, result.redirect);
  return { post: result.post };
};
