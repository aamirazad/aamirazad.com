import { listRedirectLinks } from "$lib/server/content/redirect-links";
import { runtimeEnv } from "$lib/server/env";

import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => ({
  redirectLinks: await listRedirectLinks(await runtimeEnv()),
});
