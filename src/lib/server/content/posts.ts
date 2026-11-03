import type { DraftInput, EditablePost, PostFormat, Series } from "$lib/content";
import { slugify, titlePrefix } from "$lib/content";
import { auditEvent } from "$lib/server/audit";
import { uuidV7 } from "$lib/server/crypto";
import { statement } from "$lib/server/db";
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
  is_listed: number;
  version: number;
  current_revision_id: string | null;
  published_revision_id: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
};

const POST_SELECT = `SELECT id, series, format, status, title, slug, canonical_path, summary,
  body_markdown, source_url, source_title, source_description, quote_text, quote_attribution,
  is_listed, version, current_revision_id, published_revision_id, created_at, updated_at, published_at
  FROM aamirazad_posts`;

export async function listPosts(env: RuntimeEnv): Promise<EditablePost[]> {
  const rows = await env.DB.all<PostRow>(
    `${POST_SELECT} WHERE deleted_at IS NULL ORDER BY updated_at DESC LIMIT 100`,
  );
  return rows.map(mapPost);
}

export async function getPost(env: RuntimeEnv, id: string): Promise<EditablePost | null> {
  const row = await env.DB.first<PostRow>(
    `${POST_SELECT} WHERE id = $1 AND deleted_at IS NULL LIMIT 1`,
    id,
  );
  return row ? mapPost(row) : null;
}

/** Soft-delete a post. A published post leaves the public site with it. */
export async function deletePost(
  env: RuntimeEnv,
  id: string,
  actor: string,
): Promise<{ purgePaths: string[] } | null> {
  const post = await getPost(env, id);
  if (!post) return null;
  const now = new Date().toISOString();
  await env.DB.batch([
    statement(
      `UPDATE aamirazad_posts SET deleted_at = $1, updated_at = $1, version = version + 1
      WHERE id = $2 AND deleted_at IS NULL`,
      now,
      id,
    ),
    auditEvent(actor, "post.deleted", id, now),
  ]);
  return {
    purgePaths: post.status === "published" && post.canonicalPath ? [post.canonicalPath] : [],
  };
}

export async function createMeaningfulDraft(
  env: RuntimeEnv,
  input: DraftInput,
  actor: string,
): Promise<EditablePost> {
  if (!hasMeaningfulInput(input)) throw new Error("Add something before saving a draft");
  const id = uuidV7();
  const now = new Date().toISOString();
  const slug = input.slug || slugify(input.title.replace(/^(On|Today|I Built|I Found)\s+/u, ""));
  await env.DB.batch([
    statement(
      `INSERT INTO aamirazad_posts (id, series, format, title, slug, summary, body_markdown,
      source_url, source_title, source_description, quote_text, quote_attribution, is_listed,
      created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
      id,
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
      input.isListed ? 1 : 0,
      now,
      now,
    ),
    auditEvent(actor, "draft.created", id, now),
  ]);
  const post = await getPost(env, id);
  if (!post) throw new Error("Draft creation did not return a post");
  return post;
}

export function hasMeaningfulInput(input: DraftInput): boolean {
  const prefix = titlePrefix(input.series).trim();
  return Boolean(
    (input.title.trim() && input.title.trim() !== prefix) ||
    input.bodyMarkdown.trim() ||
    input.summary.trim() ||
    input.sourceUrl.trim() ||
    input.quoteText.trim(),
  );
}

export async function updateDraft(
  env: RuntimeEnv,
  id: string,
  input: DraftInput,
): Promise<EditablePost | "conflict" | null> {
  const now = new Date().toISOString();
  const slug = input.slug || slugify(input.title.replace(/^(On|Today|I Built|I Found)\s+/u, ""));
  const changes = await env.DB.run(
    `UPDATE aamirazad_posts SET series = $1, format = $2, title = $3, slug = $4,
    summary = $5, body_markdown = $6, source_url = $7, source_title = $8, source_description = $9,
    quote_text = $10, quote_attribution = $11, is_listed = $12, version = version + 1,
    updated_at = $13
    WHERE id = $14 AND version = $15 AND deleted_at IS NULL`,
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
    input.isListed ? 1 : 0,
    now,
    id,
    input.version,
  );
  if (changes === 0) {
    return (await getPost(env, id)) ? "conflict" : null;
  }
  return getPost(env, id);
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
    isListed: row.is_listed !== 0,
    version: row.version,
    currentRevisionId: row.current_revision_id,
    publishedRevisionId: row.published_revision_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    publishedAt: row.published_at,
  };
}

function nullable(value: string): string | null {
  return value.trim() ? value.trim() : null;
}
