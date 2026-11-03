import { beforeEach, describe, expect, it } from "vitest";

import { timingSafeStringEqual, uuidV7 } from "../../src/lib/server/crypto";
import type { RuntimeEnv } from "../../src/lib/server/env";
import { createTestEnv } from "./test-env";

let env: RuntimeEnv;

beforeEach(async () => {
  env = await createTestEnv();
});

describe("Postgres publishing schema", () => {
  it("creates every table with the shared-database prefix", async () => {
    const rows = await env.DB.all<{ table_name: string }>(
      `SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' ORDER BY table_name`,
    );
    const names = rows.map((row) => row.table_name);

    expect(names.every((name) => name.startsWith("aamirazad_"))).toBe(true);
    expect(names).toEqual(
      expect.arrayContaining([
        "aamirazad_posts",
        "aamirazad_post_revisions",
        "aamirazad_assets",
        "aamirazad_sessions",
        "aamirazad_site_items",
        "aamirazad_redirect_links",
        "aamirazad_redirect_link_clicks",
        "aamirazad_schema_migrations",
      ]),
    );
    expect(names).not.toContain("aamirazad_publish_jobs");
  });

  it("seeds the legacy short links", async () => {
    await expect(
      env.DB.first(
        "SELECT target_url FROM aamirazad_redirect_links WHERE path = '/github' AND deleted_at IS NULL",
      ),
    ).resolves.toEqual({ target_url: "https://github.com/aamirazad/" });
  });

  it("enforces immutable editorial revisions", async () => {
    const now = new Date().toISOString();
    const postId = uuidV7();
    const revisionId = uuidV7();
    await env.DB.run(
      `INSERT INTO aamirazad_posts (id, series, format, title, slug, created_at, updated_at)
      VALUES ($1, 'on', 'article', 'On testing', 'testing', $2, $2)`,
      postId,
      now,
    );
    await env.DB.run(
      `INSERT INTO aamirazad_post_revisions (
        id, post_id, series, format, title, slug, summary, body_markdown,
        content_hash, reason, created_at, created_by
      ) VALUES ($1, $2, 'on', 'article', 'On testing', 'testing', '', 'Body', 'hash', 'manual', $3, 'owner')`,
      revisionId,
      postId,
      now,
    );

    await expect(
      env.DB.run("UPDATE aamirazad_post_revisions SET title = 'Changed' WHERE id = $1", revisionId),
    ).rejects.toThrow("post revisions are immutable");
    await expect(
      env.DB.run("DELETE FROM aamirazad_post_revisions WHERE id = $1", revisionId),
    ).rejects.toThrow("post revisions are immutable");
  });

  it("rolls back every statement in a failed batch", async () => {
    const now = new Date().toISOString();
    await expect(
      env.DB.batch([
        {
          text: `INSERT INTO aamirazad_redirect_links (id, path, target_url, created_at, updated_at)
          VALUES ('one', '/batch', 'https://example.com', $1, $1)`,
          params: [now],
        },
        {
          text: `INSERT INTO aamirazad_redirect_links (id, path, target_url, created_at, updated_at)
          VALUES ('two', '/batch', 'https://example.org', $1, $1)`,
          params: [now],
        },
      ]),
    ).rejects.toThrow();
    await expect(
      env.DB.first("SELECT id FROM aamirazad_redirect_links WHERE path = '/batch'"),
    ).resolves.toBeNull();
  });
});

describe("server cryptography", () => {
  it("creates UUIDv7 identifiers and compares authorization values safely", async () => {
    expect(uuidV7()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u,
    );
    await expect(timingSafeStringEqual("owner", "owner")).resolves.toBe(true);
    await expect(timingSafeStringEqual("owner", "visitor")).resolves.toBe(false);
  });
});
