import { error } from "@sveltejs/kit";

import { isSeries } from "$lib/content";
import { readPublishedIndex } from "$lib/server/public-content";
import { requireRuntimeEnv } from "$lib/server/env";

import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params, platform, url }) => {
  if (!isSeries(params.series)) error(404, "Series not found");
  const page = Math.max(1, Number.parseInt(url.searchParams.get("page") ?? "1", 10) || 1);
  return {
    series: params.series,
    index: await readPublishedIndex(requireRuntimeEnv(platform), `series/${params.series}`, page),
  };
};
