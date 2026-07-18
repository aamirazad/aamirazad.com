import type { DraftInput, EditablePost, PostAsset, PostFormat, Series } from "$lib/content";
import { slugify, titlePrefix } from "$lib/content";
import { sha256Hex, uuidV7 } from "$lib/server/crypto";
import type { RuntimeEnv } from "$lib/server/env";

type PostRow = {
  id: string;
  series: Series;
  format: PostFormat;
  status: EditablePost["status"];
  title: string;
  slug: string;
  canonical_path: string | null;
  summary: string;
  body_markdown: string;
  source_url: string | null;
  source_title: string | null;
  source_description: string | null;
  quote_text: string | null;
  quote_attribution: string | null;
  version: number;
  current_revision_id: string | null;
  published_revision_id: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
};

type AssetRow = {
  id: string;
  original_filename: string;
  mime_type: string;
  byte_size: number;
  width: number | null;
  height: number | null;
  alt_text: string;
  role: PostAsset["role"];
  position: number;
  caption: string | null;
};

export type RevisionSummary = { id: string; reason: string; createdAt: string; title: string };

const POST_SELECT = `SELECT id, series, format, status, title, slug, canonical_path, summary,
  body_markdown, source_url, source_title, source_description, quote_text, quote_attribution,
  version, current_revision_id, published_revision_id, created_at, updated_at, published_at
  FROM posts`;

export async function listPosts(env: RuntimeEnv): Promise<EditablePost[]> {
  const result = await env.DB.prepare(
    `${POST_SELECT} WHERE deleted_at IS NULL ORDER BY updated_at DESC LIMIT 100`,
  ).all<PostRow>();
  return result.results.map(mapPost);
}

export async function getPost(env: RuntimeEnv, id: string): Promise<EditablePost | null> {
  const row = await env.DB.prepare(`${POST_SELECT} WHERE id = ? AND deleted_at IS NULL LIMIT 1`)
    .bind(id)
    .first<PostRow>();
  return row ? mapPost(row) : null;
}

export async function createPost(
  env: RuntimeEnv,
  series: Series,
  format: PostFormat,
  actor: string,
): Promise<EditablePost> {
  const id = uuidV7();
  const now = new Date().toISOString();
  const title = titlePrefix(series);
  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO posts (id, series, format, title, slug, created_at, updated_at)
      VALUES (?, ?, ?, ?, '', ?, ?)`,
    ).bind(id, series, format, title, now, now),
    env.DB.prepare(
      `INSERT INTO audit_events (id, actor_subject, event_type, target_id, created_at)
      VALUES (?, ?, 'draft.created', ?, ?)`,
    ).bind(uuidV7(), actor, id, now),
  ]);
  const post = await getPost(env, id);
  if (!post) throw new Error("Draft creation did not return a post");
  return post;
}

export async function updateDraft(
  env: RuntimeEnv,
  id: string,
  input: DraftInput,
): Promise<EditablePost | "conflict" | null> {
  const now = new Date().toISOString();
  const slug = input.slug || slugify(input.title.replace(/^(On|Today|I Built|I Found)\s+/u, ""));
  const result = await env.DB.prepare(
    `UPDATE posts SET series = ?, format = ?, title = ?, slug = ?,
    summary = ?, body_markdown = ?, source_url = ?, source_title = ?, source_description = ?,
    quote_text = ?, quote_attribution = ?, version = version + 1, updated_at = ?
    WHERE id = ? AND version = ? AND deleted_at IS NULL`,
  )
    .bind(
      input.series,
      input.format,
      input.title,
      slug,
      input.summary,
      input.bodyMarkdown,
      nullable(input.sourceUrl),
      nullable(input.sourceTitle),
      nullable(input.sourceDescription),
      nullable(input.quoteText),
      nullable(input.quoteAttribution),
      now,
      id,
      input.version,
    )
    .run();
  if ((result.meta.changes ?? 0) === 0) {
    return (await getPost(env, id)) ? "conflict" : null;
  }
  return getPost(env, id);
}

export async function createRevision(
  env: RuntimeEnv,
  id: string,
  actor: string,
  reason: "manual" | "restore" | "publish" = "manual",
): Promise<string> {
  const post = await getPost(env, id);
  if (!post) throw new Error("Post not found");
  const revisionId = uuidV7();
  const now = new Date().toISOString();
  const hash = await contentHash(post);
  const existing = await env.DB.prepare(
    `SELECT id FROM post_revisions WHERE post_id = ? AND content_hash = ? AND reason = ? LIMIT 1`,
  )
    .bind(id, hash, reason)
    .first<{ id: string }>();
  if (existing) {
    await env.DB.prepare("UPDATE posts SET current_revision_id = ?, updated_at = ? WHERE id = ?")
      .bind(existing.id, now, id)
      .run();
    return existing.id;
  }
  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO post_revisions (id, post_id, series, format, title, slug,
      canonical_path, summary, body_markdown, source_url, source_title, source_description,
      quote_text, quote_attribution, content_hash, reason, created_at, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(
      revisionId,
      id,
      post.series,
      post.format,
      post.title,
      post.slug,
      post.canonicalPath,
      post.summary,
      post.bodyMarkdown,
      nullable(post.sourceUrl),
      nullable(post.sourceTitle),
      nullable(post.sourceDescription),
      nullable(post.quoteText),
      nullable(post.quoteAttribution),
      hash,
      reason,
      now,
      actor,
    ),
    env.DB.prepare("UPDATE posts SET current_revision_id = ?, updated_at = ? WHERE id = ?").bind(
      revisionId,
      now,
      id,
    ),
    env.DB.prepare(
      `INSERT INTO audit_events (id, actor_subject, event_type, target_id, created_at)
      VALUES (?, ?, 'revision.created', ?, ?)`,
    ).bind(uuidV7(), actor, revisionId, now),
  ]);
  return revisionId;
}

export async function listRevisions(env: RuntimeEnv, postId: string): Promise<RevisionSummary[]> {
  const result = await env.DB.prepare(
    `SELECT id, reason, created_at, title FROM post_revisions
    WHERE post_id = ? ORDER BY created_at DESC, id DESC LIMIT 50`,
  )
    .bind(postId)
    .all<{ id: string; reason: string; created_at: string; title: string }>();
  return result.results.map((row) => ({
    id: row.id,
    reason: row.reason,
    createdAt: row.created_at,
    title: row.title,
  }));
}

export async function restoreRevision(
  env: RuntimeEnv,
  postId: string,
  revisionId: string,
  actor: string,
): Promise<string> {
  const revision = await env.DB.prepare(
    `SELECT series, format, title, slug, summary, body_markdown,
    source_url, source_title, source_description, quote_text, quote_attribution
    FROM post_revisions WHERE id = ? AND post_id = ? LIMIT 1`,
  )
    .bind(revisionId, postId)
    .first<{
      series: Series;
      format: PostFormat;
      title: string;
      slug: string;
      summary: string;
      body_markdown: string;
      source_url: string | null;
      source_title: string | null;
      source_description: string | null;
      quote_text: string | null;
      quote_attribution: string | null;
    }>();
  if (!revision) throw new Error("Revision not found");
  const now = new Date().toISOString();
  await env.DB.prepare(
    `UPDATE posts SET series = ?, format = ?, title = ?, slug = ?, summary = ?,
    body_markdown = ?, source_url = ?, source_title = ?, source_description = ?, quote_text = ?,
    quote_attribution = ?, version = version + 1, updated_at = ? WHERE id = ?`,
  )
    .bind(
      revision.series,
      revision.format,
      revision.title,
      revision.slug,
      revision.summary,
      revision.body_markdown,
      revision.source_url,
      revision.source_title,
      revision.source_description,
      revision.quote_text,
      revision.quote_attribution,
      now,
      postId,
    )
    .run();
  return createRevision(env, postId, actor, "restore");
}

export async function listPostAssets(env: RuntimeEnv, postId: string): Promise<PostAsset[]> {
  const result = await env.DB.prepare(
    `SELECT a.id, a.original_filename, a.mime_type, a.byte_size,
    a.width, a.height, a.alt_text, pa.role, pa.position, pa.caption FROM assets a
    JOIN post_assets pa ON pa.asset_id = a.id WHERE pa.post_id = ? AND a.deleted_at IS NULL
    ORDER BY pa.position, a.id`,
  )
    .bind(postId)
    .all<AssetRow>();
  return result.results.map((row) => ({
    id: row.id,
    originalFilename: row.original_filename,
    mimeType: row.mime_type,
    byteSize: row.byte_size,
    width: row.width,
    height: row.height,
    altText: row.alt_text,
    role: row.role,
    position: row.position,
    caption: row.caption ?? "",
  }));
}

function mapPost(row: PostRow): EditablePost {
  return {
    id: row.id,
    series: row.series,
    format: row.format,
    status: row.status,
    title: row.title,
    slug: row.slug,
    canonicalPath: row.canonical_path,
    summary: row.summary,
    bodyMarkdown: row.body_markdown,
    sourceUrl: row.source_url ?? "",
    sourceTitle: row.source_title ?? "",
    sourceDescription: row.source_description ?? "",
    quoteText: row.quote_text ?? "",
    quoteAttribution: row.quote_attribution ?? "",
    version: row.version,
    currentRevisionId: row.current_revision_id,
    publishedRevisionId: row.published_revision_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    publishedAt: row.published_at,
  };
}

async function contentHash(post: EditablePost): Promise<string> {
  return sha256Hex(
    JSON.stringify({
      series: post.series,
      format: post.format,
      title: post.title,
      slug: post.slug,
      canonicalPath: post.canonicalPath,
      summary: post.summary,
      bodyMarkdown: post.bodyMarkdown,
      sourceUrl: post.sourceUrl,
      sourceTitle: post.sourceTitle,
      sourceDescription: post.sourceDescription,
      quoteText: post.quoteText,
      quoteAttribution: post.quoteAttribution,
    }),
  );
}

function nullable(value: string): string | null {
  return value.trim() ? value.trim() : null;
}
