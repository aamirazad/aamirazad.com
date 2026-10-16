import { error } from "@sveltejs/kit";

import { hasUnpublishedChanges } from "$lib/server/content/publish";
import { getPost } from "$lib/server/content/posts";
import { requireRuntimeEnv } from "$lib/server/env";

import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params, platform }) => {
  const env = requireRuntimeEnv(platform);
  const post = await getPost(env, params.id);
  if (!post) error(404, "Post not found");
  return { post, hasUnpublishedChanges: await hasUnpublishedChanges(env, post) };
};
