import { applyD1Migrations, env } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";

import { uploadPostAsset } from "../../src/lib/server/content/assets";
import {
  createPortableExport,
  restorePortableArchive,
} from "../../src/lib/server/content/portable-export";
import { createPost, createRevision, updateDraft } from "../../src/lib/server/content/posts";
import {
  completeProjection,
  prepareProjection,
  writeProjection,
} from "../../src/lib/server/content/projection";
import { tarStreamToBytes, parseTar } from "../../src/lib/server/content/tar";
import { readPublishedPost } from "../../src/lib/server/public-content";
import { uuidV7 } from "../../src/lib/server/crypto";

beforeEach(async () => {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
});

describe("portable content recovery", () => {
  it("exports Markdown and media, then restores the public site without D1", async () => {
    const post = await createPost(env, "on", "article", "owner");
    const saved = await updateDraft(env, post.id, {
      series: "on",
      format: "article",
      title: "On portable recovery",
      slug: "portable-recovery",
      summary: "A provider-independent recovery fixture.",
      bodyMarkdown: "## Recovered\n\nThe source survives.",
      sourceUrl: "",
      sourceTitle: "",
      sourceDescription: "",
      quoteText: "",
      quoteAttribution: "",
      isListed: true,
      version: post.version,
    });
    if (!saved || saved === "conflict") throw new Error("Could not save export fixture");
    const pixel = Uint8Array.from(
      atob(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
      ),
      (character) => character.charCodeAt(0),
    );
    await uploadPostAsset(
      env,
      post.id,
      new File([pixel], "pixel.png", { type: "image/png" }),
      "A recovery pixel",
      "",
      "owner",
    );
    await env.DB.prepare(
      "UPDATE posts SET canonical_path = '/on/portable-recovery', status = 'publishing' WHERE id = ?",
    )
      .bind(post.id)
      .run();
    const revisionId = await createRevision(env, post.id, "owner", "publish");
    const jobId = uuidV7();
    await env.DB.prepare(
      `INSERT INTO publish_jobs
      (id, post_id, revision_id, correlation_id, operation, status, created_at)
      VALUES (?, ?, ?, ?, 'publish', 'queued', ?)`,
    )
      .bind(jobId, post.id, revisionId, uuidV7(), new Date().toISOString())
      .run();
    const prepared = await prepareProjection(env, jobId);
    await writeProjection(env, prepared);
    await completeProjection(env, prepared);

    const exported = await createPortableExport(env, "owner");
    const archive = await tarStreamToBytes(exported.stream);
    const entries = parseTar(archive);
    expect(entries.get(`aamirazad-content-v1/posts/${post.id}/working.md`)).toBeDefined();
    expect(exported.manifest.assets).toEqual([
      expect.objectContaining({ originalFilename: "pixel.png", altText: "A recovery pixel" }),
    ]);
    expect(exported.manifest.objects.some((object) => object.target === "content")).toBe(true);
    expect(exported.manifest.objects.some((object) => object.target === "media")).toBe(true);

    for (const object of exported.manifest.objects) {
      const bucket = object.target === "content" ? env.CONTENT : env.MEDIA;
      await bucket.delete(object.r2Key);
    }
    await expect(readPublishedPost(env, "/on/portable-recovery")).resolves.toBeNull();
    await restorePortableArchive({ CONTENT: env.CONTENT, MEDIA: env.MEDIA }, archive);
    const recovered = await readPublishedPost(env, "/on/portable-recovery");
    expect(recovered && "post" in recovered ? recovered.post.bodyMarkdown : "").toContain(
      "The source survives.",
    );
    const audit = await env.DB.prepare(
      "SELECT metadata_json FROM audit_events WHERE event_type = 'portable_export.created'",
    ).first<{ metadata_json: string }>();
    expect(JSON.parse(audit?.metadata_json ?? "{}")).toMatchObject({ posts: 1, assets: 1 });
  });
});
