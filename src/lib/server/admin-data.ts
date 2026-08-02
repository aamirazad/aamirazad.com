import { listPosts } from "$lib/server/content/posts";
import { listSiteItems } from "$lib/server/content/site-items";
import { requireRuntimeEnv } from "$lib/server/env";

export async function loadAdminData(platform: App.Platform | undefined) {
  const env = requireRuntimeEnv(platform);
  const [posts, siteItems] = await Promise.all([listPosts(env), listSiteItems(env)]);
  return { posts, siteItems };
}
