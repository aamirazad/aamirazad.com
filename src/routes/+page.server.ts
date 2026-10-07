import { listPublished } from "$lib/server/public-content";
import { listSiteItems } from "$lib/server/content/site-items";
import { requireRuntimeEnv } from "$lib/server/env";

import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ platform }) => {
  const env = requireRuntimeEnv(platform);
  const [all, on, today, found, siteItems] = await Promise.all([
    listPublished(env, { pageSize: 3 }),
    listPublished(env, { series: "on", pageSize: 3 }),
    listPublished(env, { series: "today", pageSize: 3 }),
    listPublished(env, { series: "found", pageSize: 3 }),
    listSiteItems(env),
  ]);
  return {
    writing: { all: all.items, on: on.items, today: today.items, found: found.items },
    siteItems,
  };
};
