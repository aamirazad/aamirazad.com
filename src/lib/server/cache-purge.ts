import { invalidateByTag } from "@vercel/functions";

import { cacheTagsForPostPaths } from "$lib/published";

/**
 * Mark cached public pages that show a post as stale on Vercel's CDN. Purging is best-effort: the
 * change is already committed to the database, and CDN entries expire on their own within the
 * public cache TTL. Outside a Vercel deployment there is no CDN cache, so this is a no-op.
 */
export async function purgePostPaths(paths: string[]): Promise<void> {
  if (!process.env.VERCEL) return;
  try {
    await invalidateByTag(cacheTagsForPostPaths(paths));
  } catch (caught) {
    console.error("Public cache purge failed", caught);
  }
}
