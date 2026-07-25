import { readPublishedIndexResult } from "$lib/server/public-content";
import { listSiteItems } from "$lib/server/content/site-items";
import { requireRuntimeEnv } from "$lib/server/env";

import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ platform, setHeaders }) => {
  const env = requireRuntimeEnv(platform);
  const [all, on, today, found, siteItems] = await Promise.all([
    readPublishedIndexResult(env, "home"),
    readPublishedIndexResult(env, "series/on"),
    readPublishedIndexResult(env, "series/today"),
    readPublishedIndexResult(env, "series/found"),
    listSiteItems(env),
  ]);
  const siteContentUpdatedAt = siteItems.reduce(
    (latest, item) => (item.updatedAt > latest ? item.updatedAt : latest),
    new Date(0).toISOString(),
  );
  const updatedAt = siteContentUpdatedAt > all.updatedAt ? siteContentUpdatedAt : all.updatedAt;
  setHeaders({
    etag: `"${all.generation}-home-${siteItems.length}-${Date.parse(siteContentUpdatedAt)}"`,
    "last-modified": new Date(updatedAt).toUTCString(),
  });
  return {
    writing: {
      all: all.index.items,
      on: on.index.items,
      today: today.index.items,
      found: found.index.items,
    },
    siteItems,
  };
};
