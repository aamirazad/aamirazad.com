import { listRedirectLinks } from "$lib/server/content/redirect-links";
import { requireRuntimeEnv } from "$lib/server/env";

import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ platform }) => ({
  redirectLinks: await listRedirectLinks(requireRuntimeEnv(platform)),
});
