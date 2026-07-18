import { applyD1Migrations, env } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";

import { uploadPostAsset } from "../../src/lib/server/content/assets";
import {
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
  });
});
