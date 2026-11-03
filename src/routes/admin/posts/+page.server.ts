import { listPosts } from "$lib/server/content/posts";
import { runtimeEnv } from "$lib/server/env";

import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => ({
  posts: await listPosts(await runtimeEnv()),
});
