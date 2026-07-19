import { readPublishedIndex } from "$lib/server/public-content";
import { requireRuntimeEnv } from "$lib/server/env";

import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ platform }) => ({
  latest: (await readPublishedIndex(requireRuntimeEnv(platform), "home")).items,
});
