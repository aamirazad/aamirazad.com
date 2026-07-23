import { applyD1Migrations, env } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";

import { timingSafeStringEqual, uuidV7 } from "../../src/lib/server/crypto";

beforeEach(async () => {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
});

describe("D1 publishing schema", () => {
  it("creates the editorial, authentication, and job tables", async () => {
    const result = await env.DB.prepare(
      "SELECT name FROM sqlite_schema WHERE type = 'table' ORDER BY name",
    ).all<{ name: string }>();
    const names = result.results.map(({ name }) => name);

    expect(names).toContain("posts");
    expect(names).toContain("post_revisions");
    expect(names).toContain("assets");
    expect(names).toContain("sessions");
    expect(names).toContain("publish_jobs");
    expect(names).not.toContain("backup_jobs");
  });

  it("enforces immutable editorial revisions", async () => {
    const now = new Date().toISOString();
    const postId = uuidV7();
    const revisionId = uuidV7();
    await env.DB.prepare(
      `INSERT INTO posts (id, series, format, title, slug, created_at, updated_at)
      VALUES (?, 'on', 'article', 'On testing', 'testing', ?, ?)`,
    )
      .bind(postId, now, now)
      .run();
    await env.DB.prepare(
      `INSERT INTO post_revisions (
        id, post_id, series, format, title, slug, summary, body_markdown,
        content_hash, reason, created_at, created_by
      ) VALUES (?, ?, 'on', 'article', 'On testing', 'testing', '', 'Body', ?, 'manual', ?, ?)`,
    )
      .bind(revisionId, postId, "hash", now, "owner")
      .run();

    await expect(
      env.DB.prepare("UPDATE post_revisions SET title = 'Changed' WHERE id = ?")
        .bind(revisionId)
        .run(),
    ).rejects.toThrow("post revisions are immutable");
  });
});

describe("Workers cryptography", () => {
  it("creates UUIDv7 identifiers and compares authorization values safely", async () => {
    expect(uuidV7()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u,
    );
    await expect(timingSafeStringEqual("owner", "owner")).resolves.toBe(true);
    await expect(timingSafeStringEqual("owner", "visitor")).resolves.toBe(false);
  });
});
