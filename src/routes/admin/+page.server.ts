import { listPosts } from "$lib/server/content/posts";
import { requireRuntimeEnv } from "$lib/server/env";

import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals, platform }) => ({
  owner: locals.owner,
  posts: await listPosts(requireRuntimeEnv(platform)),
});
