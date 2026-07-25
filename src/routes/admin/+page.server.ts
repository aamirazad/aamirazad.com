import { listPosts } from "$lib/server/content/posts";
import { listSiteItems } from "$lib/server/content/site-items";
import { requireRuntimeEnv } from "$lib/server/env";

import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals, platform }) => {
  const env = requireRuntimeEnv(platform);
  const [posts, siteItems] = await Promise.all([listPosts(env), listSiteItems(env)]);
  return { owner: locals.owner, posts, siteItems };
};
