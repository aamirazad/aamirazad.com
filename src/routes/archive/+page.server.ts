import { error } from "@sveltejs/kit";

import { listPublished } from "$lib/server/public-content";
import { runtimeEnv } from "$lib/server/env";

import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ url }) => {
  const page = Math.max(1, Number.parseInt(url.searchParams.get("page") ?? "1", 10) || 1);
  const index = await listPublished(await runtimeEnv(), { page });
  if (page > index.totalPages) error(404, "Page not found");
  return { index };
};
