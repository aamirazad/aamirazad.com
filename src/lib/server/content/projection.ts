import type { PostFormat, Series } from "$lib/content";
import {
  CURRENT_PROJECTION_KEY,
  cacheTagForPath,
  isPublishedPostListed,
  projectionKey,
  revisionKey,
  type ProjectionManifest,
  type PublishedAsset,
  type PublishedCard,
  type PublishedIndex,
  type PublishedPost,
} from "$lib/published";
import { renderMarkdown } from "$lib/server/content/markdown";
import { ensureImageVariants } from "$lib/server/content/image-variants";
import type { PublishOperation } from "$lib/server/content/publish";
import type { RuntimeEnv } from "$lib/server/env";

type RevisionRow = {
  job_id: string;
  operation: PublishOperation;
  post_id: string;
  revision_id: string;
  content_hash: string;
  series: Series;
  format: PostFormat;
  title: string;
  slug: string;
  canonical_path: string;
  summary: string;
  body_markdown: string;
  source_url: string | null;
  source_title: string | null;
  source_description: string | null;
  quote_text: string | null;
  quote_attribution: string | null;
  is_listed: number;
  revision_created_at: string;
  job_created_at: string;
  published_at: string | null;
};

type AssetRow = {
  id: string;
  original_key: string;
  original_filename: string;
  mime_type: string;
  byte_size: number;
  width: number | null;
  height: number | null;
  alt_text: string;
  caption: string | null;
  position: number;
  sha256: string;
};

type PublishedRow = { id: string; published_revision_id: string };

export type PreparedProjection = {
  jobId: string;
  operation: PublishOperation;
  postId: string;
  canonicalPath: string;
  snapshotKey: string;
};

export async function prepareProjection(
  env: RuntimeEnv,
  jobId: string,
): Promise<PreparedProjection> {
  const row = await loadRevision(env, jobId);
  if (!row) throw new Error("Publish job or revision not found");
  await setJobStatus(env, jobId, "rendering");
  const key = revisionKey(row.post_id, row.revision_id);
  if (row.operation === "publish") {
    const assets = await loadAssets(env, row.post_id);
    const snapshot: PublishedPost = {
      schemaVersion: 1,
      id: row.post_id,
      revisionId: row.revision_id,
      contentHash: row.content_hash,
      series: row.series,
      format: row.format,
      title: row.title,
      slug: row.slug,
      canonicalPath: row.canonical_path,
      summary: row.summary,
      sourceUrl: row.source_url ?? "",
      sourceTitle: row.source_title ?? "",
      sourceDescription: row.source_description ?? "",
      quoteText: row.quote_text ?? "",
      quoteAttribution: row.quote_attribution ?? "",
      isListed: row.is_listed !== 0,
      bodyMarkdown: row.body_markdown,
      html: await renderMarkdown(row.body_markdown),
      assets,
      publishedAt: row.published_at ?? row.job_created_at,
      modifiedAt: row.revision_created_at,
    };
    await env.CONTENT.put(key, JSON.stringify(snapshot), {
      httpMetadata: { contentType: "application/json", cacheControl: "private, no-store" },
      customMetadata: { contentHash: row.content_hash, revisionId: row.revision_id },
    });
  }
  return {
    jobId,
    operation: row.operation,
    postId: row.post_id,
    canonicalPath: row.canonical_path,
    snapshotKey: key,
  };
}

export async function writeProjection(
  env: RuntimeEnv,
  prepared: PreparedProjection,
): Promise<ProjectionManifest> {
  await setJobStatus(env, prepared.jobId, "projecting");
  const result = await env.DB.prepare(
    `SELECT id, published_revision_id FROM posts WHERE status = 'published'
    AND published_revision_id IS NOT NULL AND id != ? AND deleted_at IS NULL`,
  )
    .bind(prepared.postId)
    .all<PublishedRow>();
  const snapshotKeys = result.results.map((row) => revisionKey(row.id, row.published_revision_id));
  if (prepared.operation === "publish") snapshotKeys.push(prepared.snapshotKey);
  const snapshots: PublishedPost[] = [];
  for (const key of snapshotKeys) {
    const object = await env.CONTENT.get(key);
    if (!object) throw new Error(`Published snapshot is missing: ${key}`);
    snapshots.push(await object.json<PublishedPost>());
  }
  snapshots.sort(
    (left, right) =>
      right.publishedAt.localeCompare(left.publishedAt) || right.id.localeCompare(left.id),
  );

  const aliasesResult = await env.DB.prepare(
    "SELECT path, post_id FROM slug_aliases ORDER BY path",
  ).all<{ path: string; post_id: string }>();
  const canonicalByPost = new Map(
    snapshots.map((snapshot) => [snapshot.id, snapshot.canonicalPath]),
  );
  const manifest: ProjectionManifest = {
    schemaVersion: 1,
    generation: prepared.jobId,
    updatedAt: new Date().toISOString(),
    paths: Object.fromEntries(
      snapshots.map((snapshot) => [
        snapshot.canonicalPath,
        revisionKey(snapshot.id, snapshot.revisionId),
      ]),
    ),
    aliases: Object.fromEntries(
      aliasesResult.results.flatMap((alias) => {
        const destination = canonicalByPost.get(alias.post_id);
        return destination && alias.path !== destination ? [[alias.path, destination]] : [];
      }),
    ),
    media: Object.fromEntries(
      snapshots.flatMap((snapshot) =>
        snapshot.assets.map((asset) => [
          asset.id,
          {
            originalKey: asset.originalKey,
            mimeType: asset.mimeType,
            originalFilename: asset.originalFilename,
            sha256: asset.sha256,
            variants: Object.fromEntries(
              (asset.variants ?? []).map((variant) => [
                variant.name,
                {
                  r2Key: variant.r2Key,
                  contentHash: variant.contentHash,
                  width: variant.width,
                  height: variant.height,
                  mimeType: variant.mimeType,
                  byteSize: variant.byteSize,
                },
              ]),
            ),
          },
        ]),
      ),
    ),
  };
  await writeIndexesAndFeeds(env, manifest.generation, snapshots);
  await env.CONTENT.put(CURRENT_PROJECTION_KEY, JSON.stringify(manifest), {
    httpMetadata: { contentType: "application/json", cacheControl: "private, no-store" },
  });
  return manifest;
}

export async function completeProjection(
  env: RuntimeEnv,
  prepared: PreparedProjection,
): Promise<void> {
  const now = new Date().toISOString();
  const isPublish = prepared.operation === "publish";
  await env.DB.batch([
    env.DB.prepare(
      `UPDATE posts SET status = ?, published_revision_id = CASE WHEN ? THEN
      (SELECT revision_id FROM publish_jobs WHERE id = ?) ELSE published_revision_id END,
      published_at = CASE WHEN ? AND published_at IS NULL THEN ? ELSE published_at END,
      publish_job_id = NULL, updated_at = ? WHERE id = ?`,
    ).bind(
      isPublish ? "published" : "archived",
      isPublish ? 1 : 0,
      prepared.jobId,
      isPublish ? 1 : 0,
      now,
      now,
      prepared.postId,
    ),
    env.DB.prepare(
      `UPDATE publish_jobs SET status = 'complete', completed_at = ?, error_code = NULL,
      error_message = NULL, snapshot_key = ? WHERE id = ?`,
    ).bind(now, prepared.snapshotKey, prepared.jobId),
    env.DB.prepare(
      `INSERT INTO audit_events (id, event_type, target_id, correlation_id, created_at)
      SELECT ?, ?, post_id, correlation_id, ? FROM publish_jobs WHERE id = ?`,
    ).bind(
      crypto.randomUUID(),
      isPublish ? "publication.completed" : "archive.completed",
      now,
      prepared.jobId,
    ),
  ]);
}

export async function failProjection(
  env: RuntimeEnv,
  jobId: string,
  caught: unknown,
): Promise<void> {
  const now = new Date().toISOString();
  const message = caught instanceof Error ? caught.message.slice(0, 1_000) : "Publishing failed";
  await env.DB.batch([
    env.DB.prepare(
      `UPDATE publish_jobs SET status = 'failed', error_code = 'WORKFLOW_FAILED',
      error_message = ?, completed_at = ? WHERE id = ?`,
    ).bind(message, now, jobId),
    env.DB.prepare(
      `UPDATE posts SET status = CASE WHEN published_revision_id IS NULL THEN 'failed'
      ELSE 'published' END, publish_job_id = NULL, updated_at = ?
      WHERE publish_job_id = ?`,
    ).bind(now, jobId),
  ]);
}

export async function setJobStatus(
  env: RuntimeEnv,
  jobId: string,
  status: "rendering" | "projecting" | "purging",
): Promise<void> {
  await env.DB.prepare(
    `UPDATE publish_jobs SET status = ?, started_at = COALESCE(started_at, ?),
    attempt_count = attempt_count + 1 WHERE id = ?`,
  )
    .bind(status, new Date().toISOString(), jobId)
    .run();
}

async function loadRevision(env: RuntimeEnv, jobId: string): Promise<RevisionRow | null> {
  return env.DB.prepare(
    `SELECT j.id AS job_id, j.operation, j.post_id, j.revision_id, j.created_at AS job_created_at,
    r.content_hash, r.series, r.format, r.title, r.slug, r.canonical_path, r.summary, r.body_markdown,
    r.source_url, r.source_title, r.source_description, r.quote_text, r.quote_attribution,
    r.is_listed,
    r.created_at AS revision_created_at, p.published_at FROM publish_jobs j
    JOIN post_revisions r ON r.id = j.revision_id JOIN posts p ON p.id = j.post_id
    WHERE j.id = ? LIMIT 1`,
  )
    .bind(jobId)
    .first<RevisionRow>();
}

async function loadAssets(env: RuntimeEnv, postId: string): Promise<PublishedAsset[]> {
  const result = await env.DB.prepare(
    `SELECT a.id, a.original_key, a.original_filename, a.mime_type,
    a.byte_size, a.width, a.height, a.alt_text, a.sha256, pa.caption, pa.position FROM assets a
    JOIN post_assets pa ON pa.asset_id = a.id WHERE pa.post_id = ? AND a.deleted_at IS NULL
    ORDER BY pa.position, a.id`,
  )
    .bind(postId)
    .all<AssetRow>();
  return Promise.all(
    result.results.map(async (asset) => ({
      id: asset.id,
      originalKey: asset.original_key,
      originalFilename: asset.original_filename,
      mimeType: asset.mime_type,
      byteSize: asset.byte_size,
      width: asset.width,
      height: asset.height,
      altText: asset.alt_text,
      caption: asset.caption ?? "",
      position: asset.position,
      sha256: asset.sha256,
      variants: await ensureImageVariants(env, {
        id: asset.id,
        originalKey: asset.original_key,
        mimeType: asset.mime_type,
        width: asset.width,
        height: asset.height,
      }),
    })),
  );
}

async function writeIndexesAndFeeds(
  env: RuntimeEnv,
  generation: string,
  snapshots: PublishedPost[],
): Promise<void> {
  const listedSnapshots = snapshots.filter(isPublishedPostListed);
  const cards = listedSnapshots.map(toCard);
  await putIndex(env, generation, "home", "Latest", cards.slice(0, 12), 1, 1);
  await putPagedIndexes(env, generation, "archive", "Archive", cards, 50);
  for (const series of ["on", "today", "built", "found"] as const) {
    await putPagedIndexes(
      env,
      generation,
      `series/${series}`,
      series,
      cards.filter((card) => card.series === series),
      25,
    );
  }
  const recent = listedSnapshots.slice(0, 20);
  await env.CONTENT.put(
    projectionKey(generation, "feeds/feed.xml"),
    atomFeed(env.APP_ORIGIN, recent),
    { httpMetadata: { contentType: "application/atom+xml; charset=utf-8" } },
  );
  await env.CONTENT.put(
    projectionKey(generation, "feeds/feed.json"),
    jsonFeed(env.APP_ORIGIN, recent),
    { httpMetadata: { contentType: "application/feed+json; charset=utf-8" } },
  );
  await env.CONTENT.put(
    projectionKey(generation, "sitemap.xml"),
    sitemap(env.APP_ORIGIN, listedSnapshots),
    { httpMetadata: { contentType: "application/xml; charset=utf-8" } },
  );
}

async function putPagedIndexes(
  env: RuntimeEnv,
  generation: string,
  name: string,
  title: string,
  cards: PublishedCard[],
  pageSize: number,
): Promise<void> {
  const totalPages = Math.max(1, Math.ceil(cards.length / pageSize));
  for (let page = 1; page <= totalPages; page += 1) {
    await putIndex(
      env,
      generation,
      name,
      title,
      cards.slice((page - 1) * pageSize, page * pageSize),
      page,
      totalPages,
    );
  }
}

async function putIndex(
  env: RuntimeEnv,
  generation: string,
  name: string,
  title: string,
  items: PublishedCard[],
  page: number,
  totalPages: number,
): Promise<void> {
  const index: PublishedIndex = { schemaVersion: 1, title, page, totalPages, items };
  await env.CONTENT.put(
    projectionKey(generation, `indexes/${name}/${page}.json`),
    JSON.stringify(index),
    { httpMetadata: { contentType: "application/json", cacheControl: "private, no-store" } },
  );
}

function toCard(post: PublishedPost): PublishedCard {
  return {
    id: post.id,
    series: post.series,
    format: post.format,
    title: post.title,
    canonicalPath: post.canonicalPath,
    summary: post.summary,
    publishedAt: post.publishedAt,
    modifiedAt: post.modifiedAt,
  };
}

export function atomFeed(origin: string, posts: PublishedPost[]): string {
  const updated = posts[0]?.modifiedAt ?? new Date(0).toISOString();
  return `<?xml version="1.0" encoding="utf-8"?><feed xmlns="http://www.w3.org/2005/Atom"><id>${xml(origin)}/</id><title>Aamir Azad</title><updated>${updated}</updated><link href="${xml(origin)}/feed.xml" rel="self"/>${posts.map((post) => `<entry><id>${xml(origin + post.canonicalPath)}</id><title>${xml(post.title)}</title><link href="${xml(origin + post.canonicalPath)}"/><published>${post.publishedAt}</published><updated>${post.modifiedAt}</updated><summary>${xml(post.summary)}</summary><content type="html">${xml(post.html)}</content></entry>`).join("")}</feed>`;
}

export function jsonFeed(origin: string, posts: PublishedPost[]): string {
  return JSON.stringify({
    version: "https://jsonfeed.org/version/1.1",
    title: "Aamir Azad",
    home_page_url: `${origin}/`,
    feed_url: `${origin}/feed.json`,
    items: posts.map((post) => ({
      id: `${origin}${post.canonicalPath}`,
      url: `${origin}${post.canonicalPath}`,
      title: post.title,
      summary: post.summary,
      content_html: post.html,
      date_published: post.publishedAt,
      date_modified: post.modifiedAt,
    })),
  });
}

export function sitemap(origin: string, posts: PublishedPost[]): string {
  const paths = [
    "/",
    "/on",
    "/today",
    "/built",
    "/found",
    "/archive",
    ...posts.map((post) => post.canonicalPath),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map((path) => `<url><loc>${xml(origin + path)}</loc></url>`).join("")}</urlset>`;
}

function xml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
