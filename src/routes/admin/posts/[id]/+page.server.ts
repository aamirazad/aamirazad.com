import { error } from "@sveltejs/kit";

import { hasUnpublishedChanges } from "$lib/server/content/publish";
import { getPost } from "$lib/server/content/posts";
import { runtimeEnv } from "$lib/server/env";

import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params }) => {
  const env = await runtimeEnv();
  const post = await getPost(env, params.id);
  if (!post) error(404, "Post not found");
  return { post, hasUnpublishedChanges: await hasUnpublishedChanges(env, post) };
};
