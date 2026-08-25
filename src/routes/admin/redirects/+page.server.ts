import { loadAdminData } from "$lib/server/admin-data";

import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ platform }) => loadAdminData(platform);
