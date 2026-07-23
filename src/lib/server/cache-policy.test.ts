import { describe, expect, it } from "vitest";

import { publicCachePolicy } from "$lib/server/cache-policy";

describe("public cache policy", () => {
  it("keeps browsers fresh briefly and shared cache entries warm for an hour", () => {
    expect(publicCachePolicy("/on/example")).toEqual({
      browser: "public, max-age=60, stale-while-revalidate=604800, stale-if-error=604800",
      edge: "public, max-age=3600, stale-while-revalidate=604800, stale-if-error=604800",
    });
  });

  it("uses immutable caching for content-hashed media", () => {
    expect(publicCachePolicy("/media/id/hash/480w-webp")).toEqual({
      browser: "public, max-age=31536000, immutable",
      edge: "public, max-age=31536000, immutable",
    });
  });
});
