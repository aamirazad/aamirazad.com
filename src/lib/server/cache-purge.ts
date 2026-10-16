import { cacheTagsForPostPaths } from "$lib/published";

/**
 * Drop cached public pages that show a post. Purging is best-effort: the change is already
 * committed to D1, and edge entries expire on their own within the public cache TTL. Local
 * development has no Workers Cache, so this is a no-op there.
 */
export async function purgePostPaths(
  platform: App.Platform | undefined,
  paths: string[],
): Promise<void> {
  const cache = platform?.ctx?.cache;
  if (!cache) return;
  try {
    const result = await cache.purge({ tags: cacheTagsForPostPaths(paths) });
    if (!result.success) {
      console.error("Public cache purge failed", result.errors);
    }
  } catch (caught) {
    console.error("Public cache purge failed", caught);
  }
}
