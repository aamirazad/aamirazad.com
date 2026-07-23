import { readPublishedIndexResult } from "$lib/server/public-content";
import { requireRuntimeEnv } from "$lib/server/env";

import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ platform, setHeaders }) => {
  const env = requireRuntimeEnv(platform);
  const [all, on, today, found] = await Promise.all([
    readPublishedIndexResult(env, "home"),
    readPublishedIndexResult(env, "series/on"),
    readPublishedIndexResult(env, "series/today"),
    readPublishedIndexResult(env, "series/found"),
  ]);
  setHeaders({
    etag: `"${all.generation}-home"`,
    "last-modified": new Date(all.updatedAt).toUTCString(),
  });
  return {
    writing: {
      all: all.index.items,
      on: on.index.items,
      today: today.index.items,
      found: found.index.items,
    },
  };
};
