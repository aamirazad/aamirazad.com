import { readPublishedIndexResult, readPublishedPost } from "$lib/server/public-content";
import { requireRuntimeEnv } from "$lib/server/env";

import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ platform, setHeaders }) => {
  const env = requireRuntimeEnv(platform);
  const result = await readPublishedIndexResult(env, "home");
  const first = result.index.items[0];
  const featuredResult = first ? await readPublishedPost(env, first.canonicalPath) : null;
  setHeaders({
    etag: `"${result.generation}-home"`,
    "last-modified": new Date(result.updatedAt).toUTCString(),
  });
  return {
    featured: featuredResult && "post" in featuredResult ? featuredResult.post : null,
  };
};
