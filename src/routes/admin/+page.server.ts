import { loadAdminData } from "$lib/server/admin-data";

import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals, platform }) => {
  return { owner: locals.owner, ...(await loadAdminData(platform)) };
};
