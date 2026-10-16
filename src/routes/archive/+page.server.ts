import { error } from "@sveltejs/kit";

import { listPublished } from "$lib/server/public-content";
import { requireRuntimeEnv } from "$lib/server/env";

import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ platform, url }) => {
  const page = Math.max(1, Number.parseInt(url.searchParams.get("page") ?? "1", 10) || 1);
  const index = await listPublished(requireRuntimeEnv(platform), { page });
  if (page > index.totalPages) error(404, "Page not found");
  return { index };
};
