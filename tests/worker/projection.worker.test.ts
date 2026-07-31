import { applyD1Migrations, env } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";

import { CURRENT_PROJECTION_KEY, type ProjectionManifest } from "../../src/lib/published";
import {
  createPost,
  createRevision,
  getPost,
  updateDraft,
} from "../../src/lib/server/content/posts";
import {
  completeProjection,
  prepareProjection,
  writeProjection,
} from "../../src/lib/server/content/projection";
import {
  readGeneratedObject,
  readPublishedIndex,
  readPublishedPost,
} from "../../src/lib/server/public-content";
import { uuidV7 } from "../../src/lib/server/crypto";

beforeEach(async () => {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
});

describe("atomic publishing projection", () => {
  it("publishes a revision, indexes, feeds, sitemap, and manifest using only R2 reads", async () => {
    const post = await createPost(env, "on", "article", "owner");
    const saved = await updateDraft(env, post.id, {
      series: "on",
      format: "article",
      title: "On atomic publishing",
      slug: "atomic-publishing",
      summary: "A complete projection.",
      bodyMarkdown: "## Durable\n\nThis is **published**.",
      sourceUrl: "",
      sourceTitle: "",
      sourceDescription: "",
      quoteText: "",
      quoteAttribution: "",
      isListed: true,
      version: post.version,
    });
    if (!saved || saved === "conflict") throw new Error("Could not save fixture");
    await env.DB.prepare(
      "UPDATE posts SET canonical_path = '/on/atomic-publishing', status = 'publishing' WHERE id = ?",
    )
      .bind(post.id)
      .run();
    const revisionId = await createRevision(env, post.id, "owner", "publish");
    const jobId = uuidV7();
    await env.DB.prepare(
      `INSERT INTO publish_jobs (id, post_id, revision_id, correlation_id,
      operation, status, created_at) VALUES (?, ?, ?, ?, 'publish', 'queued', ?)`,
    )
      .bind(jobId, post.id, revisionId, uuidV7(), new Date().toISOString())
      .run();

    const prepared = await prepareProjection(env, jobId);
    const manifest = await writeProjection(env, prepared);
    await completeProjection(env, prepared);

    expect(manifest.paths["/on/atomic-publishing"]).toContain(revisionId);
    const published = await readPublishedPost(env, "/on/atomic-publishing");
    expect(published && "post" in published ? published.post.html : "").toContain(
      "<strong>published</strong>",
    );
    await expect(readPublishedIndex(env, "home")).resolves.toMatchObject({
      items: [{ id: post.id }],
    });
    await expect(readGeneratedObject(env, "feeds/feed.xml")).resolves.not.toBeNull();
    await expect(readGeneratedObject(env, "feeds/feed.json")).resolves.not.toBeNull();
    await expect(readGeneratedObject(env, "sitemap.xml")).resolves.not.toBeNull();
    await expect(getPost(env, post.id)).resolves.toMatchObject({
      status: "published",
      publishedRevisionId: revisionId,
    });
  });

  it("keeps unlisted posts reachable by URL while excluding them from discovery surfaces", async () => {
    const post = await createPost(env, "today", "article", "owner");
    const saved = await updateDraft(env, post.id, {
      series: "today",
      format: "article",
      title: "Today private link",
      slug: "private-link",
      summary: "Shared directly.",
      bodyMarkdown: "This post is unlisted.",
      sourceUrl: "",
      sourceTitle: "",
      sourceDescription: "",
      quoteText: "",
      quoteAttribution: "",
      isListed: false,
      version: post.version,
    });
    if (!saved || saved === "conflict") throw new Error("Could not save unlisted fixture");
    await env.DB.prepare(
      "UPDATE posts SET canonical_path = '/today/private-link', status = 'publishing' WHERE id = ?",
    )
      .bind(post.id)
      .run();
    const revisionId = await createRevision(env, post.id, "owner", "publish");
    const jobId = uuidV7();
    await env.DB.prepare(
      `INSERT INTO publish_jobs (id, post_id, revision_id, correlation_id,
      operation, status, created_at) VALUES (?, ?, ?, ?, 'publish', 'queued', ?)`,
    )
      .bind(jobId, post.id, revisionId, uuidV7(), new Date().toISOString())
      .run();

    const prepared = await prepareProjection(env, jobId);
    await writeProjection(env, prepared);
    await completeProjection(env, prepared);

    const direct = await readPublishedPost(env, "/today/private-link");
    expect(direct && "post" in direct ? direct.post : null).toMatchObject({
      id: post.id,
      isListed: false,
    });
    for (const indexName of ["home", "archive", "series/today"]) {
      const index = await readPublishedIndex(env, indexName);
      expect(index.items).not.toEqual(
        expect.arrayContaining([expect.objectContaining({ id: post.id })]),
      );
    }
    const [atom, json, sitemap] = await Promise.all([
      readGeneratedObject(env, "feeds/feed.xml").then((object) => object?.text()),
      readGeneratedObject(env, "feeds/feed.json").then((object) => object?.text()),
      readGeneratedObject(env, "sitemap.xml").then((object) => object?.text()),
    ]);
    expect(atom).not.toContain("Today private link");
    expect(json).not.toContain("Today private link");
    expect(sitemap).not.toContain("/today/private-link");
  });

  it("does not switch the current manifest when projection preparation fails", async () => {
    const stable: ProjectionManifest = {
      schemaVersion: 1,
      generation: "stable",
      updatedAt: new Date().toISOString(),
      paths: {},
      aliases: {},
      media: {},
    };
    await env.CONTENT.put(CURRENT_PROJECTION_KEY, JSON.stringify(stable));
    const post = await createPost(env, "today", "note", "owner");
    const revision = uuidV7();
    const now = new Date().toISOString();
    await env.DB.prepare(
      `INSERT INTO post_revisions (id, post_id, series, format, title, slug,
      canonical_path, summary, body_markdown, content_hash, reason, created_at, created_by)
      VALUES (?, ?, 'today', 'note', 'Today failure', 'failure', '/today/failure', '', '', 'hash', 'publish', ?, 'owner')`,
    )
      .bind(revision, post.id, now)
      .run();
    const jobId = uuidV7();
    await env.DB.prepare(
      `INSERT INTO publish_jobs (id, post_id, revision_id, correlation_id,
      operation, status, created_at) VALUES (?, ?, ?, ?, 'archive', 'queued', ?)`,
    )
      .bind(jobId, post.id, revision, uuidV7(), now)
      .run();
    const prepared = await prepareProjection(env, jobId);
    await expect(
      writeProjection(env, { ...prepared, operation: "publish", snapshotKey: "missing" }),
    ).rejects.toThrow("missing");
    await expect(
      env.CONTENT.get(CURRENT_PROJECTION_KEY).then((object) => object?.json<ProjectionManifest>()),
    ).resolves.toMatchObject({ generation: "stable" });
  });
});
