import type { EditablePost, ValidationIssue } from "$lib/content";
import { validateDraft } from "$lib/content";
import { sha256Hex, uuidV7 } from "$lib/server/crypto";
import type { RuntimeEnv } from "$lib/server/env";

import { renderMarkdown } from "./markdown";
import { getPost } from "./posts";

export type PublishResult =
  { ok: true; post: EditablePost; purgePaths: string[] } | { ok: false; issues: ValidationIssue[] };

/**
 * Snapshot the saved draft as an immutable revision and make it the public version of the post.
 * Everything happens in one D1 batch, so the post is either fully published or untouched.
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
  const taken = await env.DB.prepare(
    "SELECT id FROM posts WHERE canonical_path = ? AND id != ? AND deleted_at IS NULL LIMIT 1",
  )
    .bind(canonicalPath, postId)
    .first();
  if (taken) {
    return {
      ok: false,
      issues: [{ field: "slug", message: `Another post already uses ${canonicalPath}.` }],
    };
  }

  const now = new Date().toISOString();
  const hash = await publishableHash(post, canonicalPath);
  const existing = await env.DB.prepare(
    "SELECT id FROM post_revisions WHERE post_id = ? AND content_hash = ? AND reason = 'publish' LIMIT 1",
  )
    .bind(postId, hash)
    .first<{ id: string }>();
  const revisionId = existing?.id ?? uuidV7();
  const statements: D1PreparedStatement[] = [];

  if (!existing) {
    statements.push(
      env.DB.prepare(
        `INSERT INTO post_revisions (id, post_id, series, format, title, slug, canonical_path,
        summary, body_markdown, html, source_url, source_title, source_description, quote_text,
        quote_attribution, is_listed, content_hash, reason, created_at, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'publish', ?, ?)`,
      ).bind(
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
      env.DB.prepare(
        "INSERT OR IGNORE INTO slug_aliases (path, post_id, created_at) VALUES (?, ?, ?)",
      ).bind(post.canonicalPath, postId, now),
    );
  }
  statements.push(
    env.DB.prepare("DELETE FROM slug_aliases WHERE path = ?").bind(canonicalPath),
    env.DB.prepare(
      `UPDATE posts SET status = 'published', canonical_path = ?, current_revision_id = ?,
      published_revision_id = ?, published_at = COALESCE(published_at, ?), updated_at = ?
      WHERE id = ?`,
    ).bind(canonicalPath, revisionId, revisionId, now, now, postId),
    auditEvent(env, actor, "post.published", postId, now),
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
      env.DB.prepare("UPDATE posts SET status = 'archived', updated_at = ? WHERE id = ?").bind(
        now,
        postId,
      ),
      auditEvent(env, actor, "post.unpublished", postId, now),
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
  const published = await env.DB.prepare("SELECT content_hash FROM post_revisions WHERE id = ?")
    .bind(post.publishedRevisionId)
    .first<{ content_hash: string }>();
  const canonicalPath = `/${post.series}/${post.slug}`;
  return published?.content_hash !== (await publishableHash(post, canonicalPath));
}

function auditEvent(env: RuntimeEnv, actor: string, type: string, target: string, now: string) {
  return env.DB.prepare(
    `INSERT INTO audit_events (id, actor_subject, event_type, target_id, created_at)
    VALUES (?, ?, ?, ?, ?)`,
  ).bind(uuidV7(), actor, type, target, now);
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
