import { readPublishedIndex } from "$lib/server/public-content";
import { requireRuntimeEnv } from "$lib/server/env";
import type { PageServerLoad } from "./$types";
export const load: PageServerLoad = async ({ platform, url }) => {
  const page = Math.max(1, Number.parseInt(url.searchParams.get("page") ?? "1", 10) || 1);
  return { index: await readPublishedIndex(requireRuntimeEnv(platform), "archive", page) };
};
