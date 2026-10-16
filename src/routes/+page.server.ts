import { listPublished } from "$lib/server/public-content";
import { listSiteItems } from "$lib/server/content/site-items";
import { requireRuntimeEnv } from "$lib/server/env";

import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ platform }) => {
  const env = requireRuntimeEnv(platform);
  const [writing, siteItems] = await Promise.all([
    listPublished(env, { pageSize: 3 }),
    listSiteItems(env),
  ]);
  return { writing: writing.items, siteItems };
};
