import { readPublishedIndexResult } from "$lib/server/public-content";
import { requireRuntimeEnv } from "$lib/server/env";
import type { PageServerLoad } from "./$types";
export const load: PageServerLoad = async ({ platform, setHeaders, url }) => {
  const page = Math.max(1, Number.parseInt(url.searchParams.get("page") ?? "1", 10) || 1);
  const result = await readPublishedIndexResult(requireRuntimeEnv(platform), "archive", page);
  setHeaders({
    etag: `"${result.generation}-archive-${page}"`,
    "last-modified": new Date(result.updatedAt).toUTCString(),
  });
  return { index: result.index };
};
