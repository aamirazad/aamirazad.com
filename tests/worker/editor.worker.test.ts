import { applyD1Migrations, env } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";

import { uploadPostAsset } from "../../src/lib/server/content/assets";
import { ensureImageVariants } from "../../src/lib/server/content/image-variants";
import {
  createMeaningfulDraft,
  createPost,
  createRevision,
  getPost,
  listPostAssets,
  listRevisions,
  restoreRevision,
  updateDraft,
} from "../../src/lib/server/content/posts";

beforeEach(async () => {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
});

describe("draft editor storage", () => {
  it("does not create a durable row until the composer has meaningful input", async () => {
    const empty = {
      series: "on" as const,
      format: "article" as const,
      title: "On",
      slug: "",
      summary: "",
      bodyMarkdown: "",
      sourceUrl: "",
      sourceTitle: "",
      sourceDescription: "",
      quoteText: "",
      quoteAttribution: "",
      version: 0,
    };
    await expect(createMeaningfulDraft(env, empty, "owner")).rejects.toThrow("Add something");
    await expect(
      env.DB.prepare("SELECT COUNT(*) AS count FROM posts").first<{ count: number }>(),
    ).resolves.toMatchObject({ count: 0 });

    const created = await createMeaningfulDraft(
      env,
      { ...empty, title: "On quiet interfaces", bodyMarkdown: "A first thought." },
      "owner",
    );
    expect(created).toMatchObject({ title: "On quiet interfaces", version: 1 });
  });

  it("autosaves with optimistic concurrency and restores immutable revisions", async () => {
    const created = await createPost(env, "on", "article", "owner");
    const first = await updateDraft(env, created.id, {
      series: "on",
      format: "article",
      title: "On first",
      slug: "first",
      summary: "",
      bodyMarkdown: "First body",
      sourceUrl: "",
      sourceTitle: "",
      sourceDescription: "",
      quoteText: "",
      quoteAttribution: "",
      version: created.version,
    });
    expect(first).not.toBe("conflict");
    if (!first || first === "conflict") throw new Error("Draft update failed");
    const revision = await createRevision(env, created.id, "owner");
    const second = await updateDraft(env, created.id, {
      ...first,
      title: "On second",
      bodyMarkdown: "Second body",
    });
    expect(second).not.toBe("conflict");
    await expect(updateDraft(env, created.id, { ...first, title: "Stale" })).resolves.toBe(
      "conflict",
    );
    await restoreRevision(env, created.id, revision, "owner");
    const restored = await getPost(env, created.id);
    expect(restored?.title).toBe("On first");
    await expect(listRevisions(env, created.id)).resolves.toHaveLength(2);
  });

  it("stores an original image in R2 and links its metadata", async () => {
    const post = await createPost(env, "today", "photo", "owner");
    const png = Uint8Array.from(
      atob(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
      ),
      (character) => character.charCodeAt(0),
    );
    const asset = await uploadPostAsset(
      env,
      post.id,
      new File([png], "pixel.png", { type: "image/png" }),
      "A pixel",
      "Tiny",
      "owner",
    );
    expect(asset).toMatchObject({ width: 1, height: 1, altText: "A pixel" });
    await expect(env.MEDIA.get(`media/originals/${asset.id}/pixel.png`)).resolves.not.toBeNull();
    await expect(listPostAssets(env, post.id)).resolves.toHaveLength(1);

    const variants = await ensureImageVariants(env, {
      id: asset.id,
      originalKey: `media/originals/${asset.id}/pixel.png`,
      mimeType: "image/png",
      width: asset.width,
      height: asset.height,
    });
    expect(variants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "1w-webp", width: 1, height: 1, mimeType: "image/webp" }),
        expect.objectContaining({ name: "fallback", width: 1, height: 1, mimeType: "image/png" }),
      ]),
    );
    for (const variant of variants) {
      expect(variant.r2Key).toContain(variant.contentHash);
      await expect(env.MEDIA.get(variant.r2Key)).resolves.not.toBeNull();
    }
  });
});
