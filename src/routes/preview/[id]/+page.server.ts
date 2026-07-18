import { error } from "@sveltejs/kit";

import { listPostAssets, getPost } from "$lib/server/content/posts";
import { renderMarkdown } from "$lib/server/content/markdown";
import { requireRuntimeEnv } from "$lib/server/env";

import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params, platform }) => {
  const env = requireRuntimeEnv(platform);
  const post = await getPost(env, params.id);
  if (!post) error(404, "Post not found");
  return {
    post,
    assets: await listPostAssets(env, post.id),
    html: await renderMarkdown(post.bodyMarkdown),
  };
};
