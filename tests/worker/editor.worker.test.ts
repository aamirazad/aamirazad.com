import { applyD1Migrations, env } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";

import { uploadPostAsset, uploadPostAssetForMarkdown } from "../../src/lib/server/content/assets";
import { ensureImageVariants } from "../../src/lib/server/content/image-variants";
import {
  createMeaningfulDraft,
  createPost,
  createRevision,
  deletePost,
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
      isListed: true,
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

  it("keeps the title independent from the selected series", async () => {
    const created = await createMeaningfulDraft(
      env,
      {
        series: "on",
        format: "article",
        title: "A title without the conventional prefix",
        slug: "",
        summary: "",
        bodyMarkdown: "Still filed in the On series.",
        sourceUrl: "",
        sourceTitle: "",
        sourceDescription: "",
        quoteText: "",
        quoteAttribution: "",
        isListed: true,
        version: 0,
      },
      "owner",
    );

    expect(created).toMatchObject({
      series: "on",
      title: "A title without the conventional prefix",
      slug: "a-title-without-the-conventional-prefix",
    });
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
      isListed: true,
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

  it("soft-deletes drafts from the editor", async () => {
    const created = await createPost(env, "on", "article", "owner");
    await expect(deletePost(env, created.id, "owner")).resolves.toBe("deleted");
    await expect(getPost(env, created.id)).resolves.toBeNull();
    await expect(deletePost(env, created.id, "owner")).resolves.toBeNull();
  });

  it("requires published posts to be archived before deletion", async () => {
    const created = await createPost(env, "on", "article", "owner");
    const revisionId = await createRevision(env, created.id, "owner");
    await env.DB.prepare(
      "UPDATE posts SET status = 'published', published_revision_id = ? WHERE id = ?",
    )
      .bind(revisionId, created.id)
      .run();
    await expect(deletePost(env, created.id, "owner")).resolves.toBe("must-archive");
    await env.DB.prepare("UPDATE posts SET status = 'archived' WHERE id = ?")
      .bind(created.id)
      .run();
    await expect(deletePost(env, created.id, "owner")).resolves.toBe("deleted");
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

  it("compresses composer uploads to WebP and returns insertable Markdown", async () => {
    const post = await createPost(env, "on", "article", "owner");
    const png = Uint8Array.from(
      atob(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
      ),
      (character) => character.charCodeAt(0),
    );
    const result = await uploadPostAssetForMarkdown(
      env,
      post.id,
      new File([png], "Tiny [Pixel].png", { type: "image/png" }),
      "owner",
    );
    expect(result.markdown).toMatch(
      new RegExp(`^!\\[tiny-pixel\\]\\(/media/${result.asset.id}/[a-f0-9]{64}/1w-webp\\)$`, "u"),
    );
    const variant = await env.DB.prepare(
      "SELECT r2_key FROM asset_variants WHERE asset_id = ? AND mime_type = 'image/webp'",
    )
      .bind(result.asset.id)
      .first<{ r2_key: string }>();
    expect(variant).not.toBeNull();
    await expect(env.MEDIA.get(variant!.r2_key)).resolves.not.toBeNull();
  });
});
