import { listPosts } from "$lib/server/content/posts";
import { listSiteItems } from "$lib/server/content/site-items";
import { listRedirectLinks } from "$lib/server/content/redirect-links";
import { requireRuntimeEnv } from "$lib/server/env";

export async function loadAdminData(platform: App.Platform | undefined) {
  const env = requireRuntimeEnv(platform);
  const [posts, siteItems, redirectLinks] = await Promise.all([
    listPosts(env),
    listSiteItems(env),
    listRedirectLinks(env),
  ]);
  return { posts, siteItems, redirectLinks };
}
