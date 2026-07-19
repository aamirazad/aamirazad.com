import { error } from "@sveltejs/kit";

import { isSeries } from "$lib/content";
import { readPublishedIndexResult } from "$lib/server/public-content";
import { requireRuntimeEnv } from "$lib/server/env";

import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params, platform, setHeaders, url }) => {
  if (!isSeries(params.series)) error(404, "Series not found");
  const page = Math.max(1, Number.parseInt(url.searchParams.get("page") ?? "1", 10) || 1);
  const result = await readPublishedIndexResult(
    requireRuntimeEnv(platform),
    `series/${params.series}`,
    page,
  );
  setHeaders({
    etag: `"${result.generation}-${params.series}-${page}"`,
    "last-modified": new Date(result.updatedAt).toUTCString(),
  });
  return {
    series: params.series,
    index: result.index,
  };
};
