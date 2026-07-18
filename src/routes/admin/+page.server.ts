import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = ({ locals }) => ({ owner: locals.owner });
