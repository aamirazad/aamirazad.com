import { applyD1Migrations, env } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";

import type { DraftInput, PostFormat, Series } from "../../src/lib/content";
import { uploadPostImage } from "../../src/lib/server/content/assets";
import {
  createMeaningfulDraft,
  deletePost,
  getPost,
  updateDraft,
} from "../../src/lib/server/content/posts";
import { publishPost, unpublishPost } from "../../src/lib/server/content/publish";
import { listPublished, readPublishedPost } from "../../src/lib/server/public-content";

function draft(series: Series, format: PostFormat, overrides: Partial<DraftInput> = {}) {
  return {
    series,
    format,
    title: "On something",
    slug: "",
    summary: "",
    bodyMarkdown: "Body",
    sourceUrl: "",
    sourceTitle: "",
    sourceDescription: "",
    quoteText: "",
    quoteAttribution: "",
    isListed: true,
    version: 0,
    ...overrides,
  };
}

const createPost = (series: Series, format: PostFormat) =>
  createMeaningfulDraft(env, draft(series, format), "owner");

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

  it("saves drafts with optimistic concurrency", async () => {
    const created = await createPost("on", "article");
    const first = await updateDraft(env, created.id, draft("on", "article", { title: "On first" }));
    expect(first).toBe("conflict");
    const saved = await updateDraft(
      env,
      created.id,
      draft("on", "article", { title: "On first", version: created.version }),
    );
    if (!saved || saved === "conflict") throw new Error("Draft update failed");
    expect(saved).toMatchObject({ title: "On first", slug: "first", version: 2 });
  });

  it("publishes, updates, and unpublishes a post synchronously", async () => {
    const created = await createPost("on", "article");
    const published = await publishPost(env, created.id, "owner");
    expect(published).toMatchObject({ ok: true, purgePaths: ["/on/something"] });
    const read = await readPublishedPost(env, "/on/something");
    expect(read).toMatchObject({ post: { title: "On something", html: "<p>Body</p>" } });
    await expect(listPublished(env)).resolves.toMatchObject({ items: [{ id: created.id }] });

    const current = await getPost(env, created.id);
    await updateDraft(
      env,
      created.id,
      draft("on", "article", { slug: "renamed", version: current!.version }),
    );
    await expect(readPublishedPost(env, "/on/something")).resolves.toMatchObject({
      post: { canonicalPath: "/on/something" },
    });
    await publishPost(env, created.id, "owner");
    await expect(readPublishedPost(env, "/on/something")).resolves.toEqual({
      redirect: "/on/renamed",
    });

    await unpublishPost(env, created.id, "owner");
    await expect(readPublishedPost(env, "/on/renamed")).resolves.toBeNull();
    await expect(listPublished(env)).resolves.toMatchObject({ items: [] });
  });

  it("rejects publication that is incomplete or reuses another post's path", async () => {
    const photo = await createPost("today", "photo");
    await expect(publishPost(env, photo.id, "owner")).resolves.toMatchObject({ ok: false });
    const first = await createPost("on", "article");
    const second = await createPost("on", "article");
    await publishPost(env, first.id, "owner");
    await expect(publishPost(env, second.id, "owner")).resolves.toMatchObject({
      ok: false,
      issues: [{ field: "slug" }],
    });
  });

  it("soft-deletes posts, including published ones", async () => {
    const created = await createPost("on", "article");
    await publishPost(env, created.id, "owner");
    await expect(deletePost(env, created.id, "owner")).resolves.toEqual({
      purgePaths: ["/on/something"],
    });
    await expect(getPost(env, created.id)).resolves.toBeNull();
    await expect(readPublishedPost(env, "/on/something")).resolves.toBeNull();
    await expect(deletePost(env, created.id, "owner")).resolves.toBeNull();
  });

  it("compresses composer uploads to WebP and returns insertable Markdown", async () => {
    const post = await createPost("on", "article");
    const png = Uint8Array.from(
      atob(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
      ),
      (character) => character.charCodeAt(0),
    );
    const result = await uploadPostImage(
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
