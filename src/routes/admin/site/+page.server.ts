import { listSiteItems } from "$lib/server/content/site-items";
import { runtimeEnv } from "$lib/server/env";

import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => ({
  siteItems: await listSiteItems(await runtimeEnv()),
});
