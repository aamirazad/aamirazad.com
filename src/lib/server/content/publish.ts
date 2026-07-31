import type { EditablePost, PostAsset } from "$lib/content";
import { validateDraft } from "$lib/content";
import { sha256Hex, uuidV7 } from "$lib/server/crypto";
import type { RuntimeEnv } from "$lib/server/env";

import { getPost, listPostAssets } from "./posts";

export type PublishOperation = "publish" | "archive";
export type PublishWorkflowParams = { jobId: string };
export type PublishJobState = {
  id: string;
  operation: PublishOperation;
  status: "queued" | "rendering" | "projecting" | "purging" | "complete" | "failed";
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
};

type JobRow = {
  id: string;
  operation: PublishOperation;
  status: PublishJobState["status"];
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
};

export async function enqueuePublication(
  env: RuntimeEnv,
  postId: string,
  actor: string,
): Promise<{ jobId: string; issues: ReturnType<typeof validateDraft> }> {
  const post = await getPost(env, postId);
  if (!post) throw new Error("Post not found");
  const assets = await listPostAssets(env, postId);
  const issues = validateDraft(post, { forPublication: true, assets });
  if (!post.slug) issues.push({ field: "slug", message: "Add a slug before publishing." });
  if (issues.length) return { jobId: "", issues };

  const active = await activeJob(env, postId, "publish");
  if (active) {
    await startWorkflow(env, active.id);
    return { jobId: active.id, issues: [] };
  }

  const canonicalPath = `/${post.series}/${post.slug}`;
  const now = new Date().toISOString();
  const revisionId = uuidV7();
  const jobId = uuidV7();
  const correlationId = uuidV7();
  const hash = await publishableHash(post, canonicalPath, assets);
  const existingRevision = await env.DB.prepare(
    "SELECT id FROM post_revisions WHERE post_id = ? AND content_hash = ? AND reason = 'publish' LIMIT 1",
  )
    .bind(postId, hash)
    .first<{ id: string }>();
  const effectiveRevisionId = existingRevision?.id ?? revisionId;
  const statements: D1PreparedStatement[] = [];

  if (!existingRevision) {
    statements.push(
      env.DB.prepare(
        `INSERT INTO post_revisions (id, post_id, series, format, title, slug, canonical_path,
        summary, body_markdown, source_url, source_title, source_description, quote_text,
        quote_attribution, is_listed, content_hash, reason, created_at, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'publish', ?, ?)`,
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
  if (post.canonicalPath && post.canonicalPath !== canonicalPath) {
    statements.push(
      env.DB.prepare(
        "INSERT OR IGNORE INTO slug_aliases (path, post_id, created_at) VALUES (?, ?, ?)",
      ).bind(post.canonicalPath, postId, now),
    );
  }
  statements.push(
    env.DB.prepare(
      `INSERT INTO publish_jobs (id, post_id, revision_id, correlation_id, operation, status, created_at)
      VALUES (?, ?, ?, ?, 'publish', 'queued', ?)`,
    ).bind(jobId, postId, effectiveRevisionId, correlationId, now),
    env.DB.prepare(
      `UPDATE posts SET status = 'publishing', canonical_path = ?, current_revision_id = ?,
      publish_job_id = ?, updated_at = ? WHERE id = ?`,
    ).bind(canonicalPath, effectiveRevisionId, jobId, now, postId),
    env.DB.prepare(
      `INSERT INTO audit_events (id, actor_subject, event_type, target_id, correlation_id, created_at)
      VALUES (?, ?, 'publication.queued', ?, ?, ?)`,
    ).bind(uuidV7(), actor, postId, correlationId, now),
  );
  await env.DB.batch(statements);
  await startWorkflow(env, jobId);
  return { jobId, issues: [] };
}

export async function enqueueArchive(
  env: RuntimeEnv,
  postId: string,
  actor: string,
): Promise<string> {
  const post = await getPost(env, postId);
  if (!post?.publishedRevisionId) throw new Error("Only a published post can be archived.");
  const active = await activeJob(env, postId, "archive");
  if (active) {
    await startWorkflow(env, active.id);
    return active.id;
  }
  const jobId = uuidV7();
  const correlationId = uuidV7();
  const now = new Date().toISOString();
  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO publish_jobs (id, post_id, revision_id, correlation_id, operation, status, created_at)
      VALUES (?, ?, ?, ?, 'archive', 'queued', ?)`,
    ).bind(jobId, postId, post.publishedRevisionId, correlationId, now),
    env.DB.prepare(
      "UPDATE posts SET status = 'publishing', publish_job_id = ?, updated_at = ? WHERE id = ?",
    ).bind(jobId, now, postId),
    env.DB.prepare(
      `INSERT INTO audit_events (id, actor_subject, event_type, target_id, correlation_id, created_at)
      VALUES (?, ?, 'archive.queued', ?, ?, ?)`,
    ).bind(uuidV7(), actor, postId, correlationId, now),
  ]);
  await startWorkflow(env, jobId);
  return jobId;
}

export async function readPublishJob(
  env: RuntimeEnv,
  jobId: string,
): Promise<PublishJobState | null> {
  const row = await env.DB.prepare(
    `SELECT id, operation, status, error_message, created_at, completed_at
    FROM publish_jobs WHERE id = ? LIMIT 1`,
  )
    .bind(jobId)
    .first<JobRow>();
  return row
    ? {
        id: row.id,
        operation: row.operation,
        status: row.status,
        errorMessage: row.error_message,
        createdAt: row.created_at,
        completedAt: row.completed_at,
      }
    : null;
}

async function activeJob(env: RuntimeEnv, postId: string, operation: PublishOperation) {
  return env.DB.prepare(
    `SELECT id FROM publish_jobs WHERE post_id = ? AND operation = ?
    AND status IN ('queued', 'rendering', 'projecting', 'purging') ORDER BY created_at DESC LIMIT 1`,
  )
    .bind(postId, operation)
    .first<{ id: string }>();
}

async function startWorkflow(env: RuntimeEnv, jobId: string): Promise<void> {
  try {
    const existing = await env.PUBLISH_WORKFLOW.get(jobId);
    await existing.status();
  } catch {
    await env.PUBLISH_WORKFLOW.create({ id: jobId, params: { jobId } });
  }
}

async function publishableHash(
  post: EditablePost,
  canonicalPath: string,
  assets: PostAsset[],
): Promise<string> {
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
      assets: assets.map(({ id, altText, caption, position }) => ({
        id,
        altText,
        caption,
        position,
      })),
    }),
  );
}

function nullable(value: string): string | null {
  return value.trim() ? value.trim() : null;
}
