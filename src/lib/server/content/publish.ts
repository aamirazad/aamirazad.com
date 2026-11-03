import type { EditablePost, ValidationIssue } from "$lib/content";
import { validateDraft } from "$lib/content";
import { auditEvent } from "$lib/server/audit";
import { sha256Hex, uuidV7 } from "$lib/server/crypto";
import { statement, type Statement } from "$lib/server/db";
import type { RuntimeEnv } from "$lib/server/env";

import { renderMarkdown } from "./markdown";
import { getPost } from "./posts";

export type PublishResult =
  { ok: true; post: EditablePost; purgePaths: string[] } | { ok: false; issues: ValidationIssue[] };

/**
 * Snapshot the saved draft as an immutable revision and make it the public version of the post.
 * Everything happens in one transaction, so the post is either fully published or untouched.
 */
export async function publishPost(
  env: RuntimeEnv,
  postId: string,
  actor: string,
): Promise<PublishResult | null> {
  const post = await getPost(env, postId);
  if (!post) return null;
  const issues = validateDraft(post, { forPublication: true });
  if (!post.slug) issues.push({ field: "slug", message: "Add a slug before publishing." });
  if (issues.length) return { ok: false, issues };

  const canonicalPath = `/${post.series}/${post.slug}`;
  const taken = await env.DB.first(
    `SELECT id FROM aamirazad_posts
    WHERE canonical_path = $1 AND id != $2 AND deleted_at IS NULL LIMIT 1`,
    canonicalPath,
    postId,
  );
  if (taken) {
    return {
      ok: false,
      issues: [{ field: "slug", message: `Another post already uses ${canonicalPath}.` }],
    };
  }

  const now = new Date().toISOString();
  const hash = await publishableHash(post, canonicalPath);
  const existing = await env.DB.first<{ id: string }>(
    `SELECT id FROM aamirazad_post_revisions
    WHERE post_id = $1 AND content_hash = $2 AND reason = 'publish' LIMIT 1`,
    postId,
    hash,
  );
  const revisionId = existing?.id ?? uuidV7();
  const statements: Statement[] = [];

  if (!existing) {
    statements.push(
      statement(
        `INSERT INTO aamirazad_post_revisions (id, post_id, series, format, title, slug,
        canonical_path, summary, body_markdown, html, source_url, source_title, source_description,
        quote_text, quote_attribution, is_listed, content_hash, reason, created_at, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17,
        'publish', $18, $19)`,
        revisionId,
        postId,
        post.series,
        post.format,
        post.title,
        post.slug,
        canonicalPath,
        post.summary,
        post.bodyMarkdown,
        await renderMarkdown(post.bodyMarkdown),
        nullable(post.sourceUrl),
        nullable(post.sourceTitle),
        nullable(post.sourceDescription),
        nullable(post.quoteText),
        nullable(post.quoteAttribution),
        post.isListed ? 1 : 0,
        hash,
        now,
        actor,
      ),
    );
  }
  const purgePaths = [canonicalPath];
  if (post.canonicalPath && post.canonicalPath !== canonicalPath) {
    // Keep the old address working by redirecting it to the new one.
    purgePaths.push(post.canonicalPath);
    statements.push(
      statement(
        `INSERT INTO aamirazad_slug_aliases (path, post_id, created_at) VALUES ($1, $2, $3)
        ON CONFLICT (path) DO NOTHING`,
        post.canonicalPath,
        postId,
        now,
      ),
    );
  }
  statements.push(
    statement("DELETE FROM aamirazad_slug_aliases WHERE path = $1", canonicalPath),
    statement(
      `UPDATE aamirazad_posts SET status = 'published', canonical_path = $1,
      current_revision_id = $2, published_revision_id = $2,
      published_at = COALESCE(published_at, $3), updated_at = $3
      WHERE id = $4`,
      canonicalPath,
      revisionId,
      now,
      postId,
    ),
    auditEvent(actor, "post.published", postId, now),
  );
  await env.DB.batch(statements);
  const published = await getPost(env, postId);
  if (!published) return null;
  return { ok: true, post: published, purgePaths };
}

/** Take a post off the public site while keeping its draft and revisions. */
export async function unpublishPost(
  env: RuntimeEnv,
  postId: string,
  actor: string,
): Promise<{ post: EditablePost; purgePaths: string[] } | null> {
  const post = await getPost(env, postId);
  if (!post) return null;
  const now = new Date().toISOString();
  if (post.status === "published") {
    await env.DB.batch([
      statement(
        "UPDATE aamirazad_posts SET status = 'archived', updated_at = $1 WHERE id = $2",
        now,
        postId,
      ),
      auditEvent(actor, "post.unpublished", postId, now),
    ]);
  }
  const updated = await getPost(env, postId);
  return updated
    ? { post: updated, purgePaths: post.canonicalPath ? [post.canonicalPath] : [] }
    : null;
}

/** True when the saved draft differs from what is currently public. */
export async function hasUnpublishedChanges(env: RuntimeEnv, post: EditablePost) {
  if (post.status !== "published" || !post.publishedRevisionId) return false;
  const published = await env.DB.first<{ content_hash: string }>(
    "SELECT content_hash FROM aamirazad_post_revisions WHERE id = $1",
    post.publishedRevisionId,
  );
  const canonicalPath = `/${post.series}/${post.slug}`;
  return published?.content_hash !== (await publishableHash(post, canonicalPath));
}

async function publishableHash(post: EditablePost, canonicalPath: string): Promise<string> {
  return sha256Hex(
    JSON.stringify({
      series: post.series,
      format: post.format,
      title: post.title,
      slug: post.slug,
      canonicalPath,
      summary: post.summary,
      bodyMarkdown: post.bodyMarkdown,
      sourceUrl: post.sourceUrl,
      sourceTitle: post.sourceTitle,
      sourceDescription: post.sourceDescription,
      quoteText: post.quoteText,
      quoteAttribution: post.quoteAttribution,
      isListed: post.isListed,
    }),
  );
}

function nullable(value: string): string | null {
  return value.trim() ? value.trim() : null;
}
