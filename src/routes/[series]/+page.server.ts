import { error } from "@sveltejs/kit";

import { isSeries } from "$lib/content";
import { listPublished } from "$lib/server/public-content";
import { requireRuntimeEnv } from "$lib/server/env";

import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params, platform, url }) => {
  if (!isSeries(params.series)) error(404, "Series not found");
  const page = Math.max(1, Number.parseInt(url.searchParams.get("page") ?? "1", 10) || 1);
  const index = await listPublished(requireRuntimeEnv(platform), {
    series: params.series,
    page,
    pageSize: 25,
  });
  if (page > index.totalPages) error(404, "Page not found");
  return { series: params.series, index };
};
