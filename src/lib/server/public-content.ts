import type { PostFormat, Series } from "$lib/content";
import type { PublishedCard, PublishedIndex, PublishedPost } from "$lib/published";
import { renderMarkdown } from "$lib/server/content/markdown";
import type { RuntimeEnv } from "$lib/server/env";

type PublishedRow = {
  id: string;
  revision_id: string;
  content_hash: string;
  series: Series;
  format: PostFormat;
  title: string;
  slug: string;
  canonical_path: string;
  summary: string;
  body_markdown: string;
  html: string | null;
  source_url: string | null;
  source_title: string | null;
  source_description: string | null;
  quote_text: string | null;
  quote_attribution: string | null;
  is_listed: number;
  published_at: string;
  modified_at: string;
};

const PUBLISHED_FROM = `FROM posts p JOIN post_revisions r ON r.id = p.published_revision_id
  WHERE p.status = 'published' AND p.deleted_at IS NULL`;
const CARD_COLUMNS = `p.id, r.series, r.format, r.title, r.canonical_path, r.summary,
  p.published_at, r.created_at AS modified_at`;
const POST_COLUMNS = `p.id, r.id AS revision_id, r.content_hash, r.series, r.format, r.title,
  r.slug, r.canonical_path, r.summary, r.body_markdown, r.html, r.source_url, r.source_title,
  r.source_description, r.quote_text, r.quote_attribution, r.is_listed, p.published_at,
  r.created_at AS modified_at`;
const NEWEST_FIRST = "ORDER BY p.published_at DESC, p.id DESC";

export async function listPublished(
  env: RuntimeEnv,
  options: { series?: Series; page?: number; pageSize?: number } = {},
): Promise<PublishedIndex> {
  const pageSize = options.pageSize ?? 50;
  const page = Math.max(1, options.page ?? 1);
  const seriesFilter = options.series ? "AND r.series = ?" : "";
  const params = options.series ? [options.series] : [];
  const [count, rows] = await env.DB.batch<{ total: number } | PublishedRow>([
    env.DB.prepare(
      `SELECT COUNT(*) AS total ${PUBLISHED_FROM} AND r.is_listed = 1 ${seriesFilter}`,
    ).bind(...params),
    env.DB.prepare(
      `SELECT ${CARD_COLUMNS} ${PUBLISHED_FROM} AND r.is_listed = 1 ${seriesFilter}
      ${NEWEST_FIRST} LIMIT ? OFFSET ?`,
    ).bind(...params, pageSize, (page - 1) * pageSize),
  ]);
  const total = (count.results[0] as { total: number } | undefined)?.total ?? 0;
  return {
    page,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    items: (rows.results as PublishedRow[]).map(toCard),
  };
}

export async function readPublishedPost(
  env: RuntimeEnv,
  path: string,
): Promise<{ post: PublishedPost } | { redirect: string } | null> {
  const row = await env.DB.prepare(
    `SELECT ${POST_COLUMNS} ${PUBLISHED_FROM} AND r.canonical_path = ?`,
  )
    .bind(path)
    .first<PublishedRow>();
  if (row) return { post: await toPost(row) };
  const alias = await env.DB.prepare(
    `SELECT r.canonical_path FROM slug_aliases a JOIN posts p ON p.id = a.post_id
    JOIN post_revisions r ON r.id = p.published_revision_id
    WHERE a.path = ? AND p.status = 'published' AND p.deleted_at IS NULL LIMIT 1`,
  )
    .bind(path)
    .first<{ canonical_path: string }>();
  return alias && alias.canonical_path !== path ? { redirect: alias.canonical_path } : null;
}

/** Full listed posts for feeds and the sitemap, newest first. */
export async function listPublishedPosts(env: RuntimeEnv, limit: number): Promise<PublishedPost[]> {
  const result = await env.DB.prepare(
    `SELECT ${POST_COLUMNS} ${PUBLISHED_FROM} AND r.is_listed = 1 ${NEWEST_FIRST} LIMIT ?`,
  )
    .bind(limit)
    .all<PublishedRow>();
  return Promise.all(result.results.map(toPost));
}

function toCard(row: PublishedRow): PublishedCard {
  return {
    id: row.id,
    series: row.series,
    format: row.format,
    title: row.title,
    canonicalPath: row.canonical_path,
    summary: row.summary,
    publishedAt: row.published_at,
    modifiedAt: row.modified_at,
  };
}

async function toPost(row: PublishedRow): Promise<PublishedPost> {
  return {
    ...toCard(row),
    revisionId: row.revision_id,
    contentHash: row.content_hash,
    slug: row.slug,
    sourceUrl: row.source_url ?? "",
    sourceTitle: row.source_title ?? "",
    sourceDescription: row.source_description ?? "",
    quoteText: row.quote_text ?? "",
    quoteAttribution: row.quote_attribution ?? "",
    isListed: row.is_listed !== 0,
    // Revisions published before HTML was stored in D1 are rendered on read.
    html: row.html ?? (await renderMarkdown(row.body_markdown)),
  };
}
