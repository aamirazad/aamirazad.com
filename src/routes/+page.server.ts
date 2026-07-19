import { readPublishedIndexResult } from "$lib/server/public-content";
import { requireRuntimeEnv } from "$lib/server/env";

import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ platform, setHeaders }) => {
  const result = await readPublishedIndexResult(requireRuntimeEnv(platform), "home");
  setHeaders({
    etag: `"${result.generation}-home"`,
    "last-modified": new Date(result.updatedAt).toUTCString(),
  });
  return { latest: result.index.items };
};
