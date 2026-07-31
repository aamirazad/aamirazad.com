import type { PostFormat, Series } from "$lib/content";
import { CURRENT_PROJECTION_KEY, type ProjectionManifest } from "$lib/published";
import { sha256Hex, uuidV7 } from "$lib/server/crypto";
import type { RuntimeEnv } from "$lib/server/env";
import { createTarStream, parseTar, textTarEntry, type TarEntry } from "./tar";

const ROOT = "aamirazad-content-v1";

type PostRow = {
  id: string;
  series: Series;
  format: PostFormat;
  status: string;
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
  current_revision_id: string | null;
  published_revision_id: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
};

type RevisionRow = Omit<
  PostRow,
  "status" | "current_revision_id" | "published_revision_id" | "updated_at" | "published_at"
> & {
  post_id: string;
  content_hash: string;
  reason: string;
};

type AssetRow = {
  id: string;
  original_key: string;
  sha256: string;
  original_filename: string;
  extension: string;
  mime_type: string;
  byte_size: number;
  width: number | null;
  height: number | null;
  alt_text: string;
  created_at: string;
};

type VariantRow = {
  asset_id: string;
  variant: string;
  r2_key: string;
  width: number;
  height: number;
  mime_type: string;
  byte_size: number;
  content_hash: string;
};

type PostAssetRow = {
  post_id: string;
  asset_id: string;
  role: string;
  position: number;
  caption: string | null;
};

export type PortableObject = {
  target: "content" | "media";
  r2Key: string;
  archivePath: string;
  byteSize: number;
  contentType: string;
  cacheControl?: string;
  customMetadata?: Record<string, string>;
};

export type PortableManifest = {
  schemaVersion: 1;
  exportId: string;
  generatedAt: string;
  posts: Array<{
    id: string;
    workingPath: string;
    revisionPaths: string[];
    assetIds: string[];
  }>;
  aliases: Array<{ path: string; postId: string }>;
  assets: Array<{
    id: string;
    originalFilename: string;
    sha256: string;
    mimeType: string;
    width: number | null;
    height: number | null;
    altText: string;
    originalPath: string;
    variants: Array<{
      name: string;
      path: string;
      contentHash: string;
      width: number;
      height: number;
      mimeType: string;
    }>;
  }>;
  objects: PortableObject[];
};

export type PortableExport = {
  manifest: PortableManifest;
  stream: ReadableStream<Uint8Array>;
};

export async function createPortableExport(
  env: RuntimeEnv,
  actor: string,
): Promise<PortableExport> {
  const generatedAt = new Date().toISOString();
  const exportId = uuidV7();
  const [posts, revisions, aliases, assets, variants, postAssets] = await Promise.all([
    all<PostRow>(
      env,
      `SELECT id, series, format, status, title, slug, canonical_path, summary,
      body_markdown, source_url, source_title, source_description, quote_text, quote_attribution,
      is_listed, current_revision_id, published_revision_id, created_at, updated_at, published_at
      FROM posts WHERE deleted_at IS NULL ORDER BY created_at, id`,
    ),
    all<RevisionRow>(
      env,
      `SELECT r.id, r.post_id, r.series, r.format, r.title, r.slug,
      r.canonical_path, r.summary, r.body_markdown, r.source_url, r.source_title,
      r.source_description, r.quote_text, r.quote_attribution, r.is_listed, r.content_hash, r.reason,
      r.created_at FROM post_revisions r JOIN posts p ON p.id = r.post_id
      WHERE p.deleted_at IS NULL ORDER BY r.post_id, r.created_at, r.id`,
    ),
    all<{ path: string; post_id: string }>(
      env,
      `SELECT s.path, s.post_id FROM slug_aliases s
      JOIN posts p ON p.id = s.post_id WHERE p.deleted_at IS NULL ORDER BY s.path`,
    ),
    all<AssetRow>(
      env,
      `SELECT DISTINCT a.id, a.original_key, a.sha256, a.original_filename,
      a.extension, a.mime_type, a.byte_size, a.width, a.height, a.alt_text, a.created_at
      FROM assets a JOIN post_assets pa ON pa.asset_id = a.id JOIN posts p ON p.id = pa.post_id
      WHERE a.deleted_at IS NULL AND p.deleted_at IS NULL ORDER BY a.created_at, a.id`,
    ),
    all<VariantRow>(
      env,
      `SELECT v.asset_id, v.variant, v.r2_key, v.width, v.height,
      v.mime_type, v.byte_size, v.content_hash FROM asset_variants v JOIN assets a ON a.id = v.asset_id
      WHERE a.deleted_at IS NULL ORDER BY v.asset_id, v.width, v.variant`,
    ),
    all<PostAssetRow>(
      env,
      `SELECT pa.post_id, pa.asset_id, pa.role, pa.position, pa.caption
      FROM post_assets pa JOIN posts p ON p.id = pa.post_id JOIN assets a ON a.id = pa.asset_id
      WHERE p.deleted_at IS NULL AND a.deleted_at IS NULL ORDER BY pa.post_id, pa.position, pa.asset_id`,
    ),
  ]);

  const entries: TarEntry[] = [];
  const objects: PortableObject[] = [];
  for (const post of posts) {
    const workingPath = `${ROOT}/posts/${post.id}/working.md`;
    entries.push(
      textTarEntry(workingPath, markdownDocument(postMetadata(post), post.body_markdown)),
    );
    for (const revision of revisions.filter((item) => item.post_id === post.id)) {
      entries.push(
        textTarEntry(
          `${ROOT}/posts/${post.id}/revisions/${revision.id}.md`,
          markdownDocument(revisionMetadata(revision), revision.body_markdown),
        ),
      );
    }
    const relationships = postAssets.filter((item) => item.post_id === post.id);
    entries.push(
      textTarEntry(
        `${ROOT}/posts/${post.id}/assets.json`,
        `${JSON.stringify(relationships.map(mapPostAsset), null, 2)}\n`,
      ),
    );
  }

  for (const asset of assets) {
    const archivePath = `${ROOT}/media/${asset.id}/original.${safeExtension(asset.extension)}`;
    objects.push(await r2Object(env.MEDIA, "media", asset.original_key, archivePath));
    for (const variant of variants.filter((item) => item.asset_id === asset.id)) {
      const path = `${ROOT}/media/${asset.id}/variants/${safeName(variant.variant)}.${extensionFor(variant.mime_type)}`;
      objects.push(await r2Object(env.MEDIA, "media", variant.r2_key, path));
    }
  }

  const current = await env.CONTENT.get(CURRENT_PROJECTION_KEY);
  if (current) {
    const projection = await current.json<ProjectionManifest>();
    const keys = new Set([CURRENT_PROJECTION_KEY, ...Object.values(projection.paths)]);
    for (const object of await listAll(
      env.CONTENT,
      `published/projections/${projection.generation}/`,
    )) {
      keys.add(object.key);
    }
    for (const key of [...keys].sort()) {
      objects.push(await r2Object(env.CONTENT, "content", key, `${ROOT}/projection/${key}`));
    }
  }

  for (const object of objects) entries.push(r2TarEntry(env, object));
  const manifest: PortableManifest = {
    schemaVersion: 1,
    exportId,
    generatedAt,
    posts: posts.map((post) => ({
      id: post.id,
      workingPath: `${ROOT}/posts/${post.id}/working.md`,
      revisionPaths: revisions
        .filter((item) => item.post_id === post.id)
        .map((item) => `${ROOT}/posts/${post.id}/revisions/${item.id}.md`),
      assetIds: postAssets.filter((item) => item.post_id === post.id).map((item) => item.asset_id),
    })),
    aliases: aliases.map((alias) => ({ path: alias.path, postId: alias.post_id })),
    assets: assets.map((asset) => ({
      id: asset.id,
      originalFilename: asset.original_filename,
      sha256: asset.sha256,
      mimeType: asset.mime_type,
      width: asset.width,
      height: asset.height,
      altText: asset.alt_text,
      originalPath: objects.find(
        (object) => object.target === "media" && object.r2Key === asset.original_key,
      )!.archivePath,
      variants: variants
        .filter((item) => item.asset_id === asset.id)
        .map((variant) => ({
          name: variant.variant,
          path: objects.find(
            (object) => object.target === "media" && object.r2Key === variant.r2_key,
          )!.archivePath,
          contentHash: variant.content_hash,
          width: variant.width,
          height: variant.height,
          mimeType: variant.mime_type,
        })),
    })),
    objects: objects.toSorted((left, right) => left.archivePath.localeCompare(right.archivePath)),
  };
  entries.push(textTarEntry(`${ROOT}/manifest.json`, `${JSON.stringify(manifest, null, 2)}\n`));
  entries.push(textTarEntry(`${ROOT}/schema-version.txt`, "1\n"));
  entries.push(textTarEntry(`${ROOT}/README.md`, archiveReadme()));

  await env.DB.prepare(
    `INSERT INTO audit_events
    (id, actor_subject, event_type, target_id, metadata_json, created_at)
    VALUES (?, ?, 'portable_export.created', ?, ?, ?)`,
  )
    .bind(
      uuidV7(),
      actor,
      exportId,
      JSON.stringify({ posts: posts.length, assets: assets.length }),
      generatedAt,
    )
    .run();
  return { manifest, stream: createTarStream(entries) };
}

export async function restorePortableArchive(
  bindings: Pick<RuntimeEnv, "CONTENT" | "MEDIA">,
  bytes: Uint8Array,
): Promise<PortableManifest> {
  const entries = parseTar(bytes);
  const manifestBytes = entries.get(`${ROOT}/manifest.json`);
  if (!manifestBytes) throw new Error("Portable export manifest is missing");
  const manifest = JSON.parse(new TextDecoder().decode(manifestBytes)) as PortableManifest;
  if (manifest.schemaVersion !== 1 || !Array.isArray(manifest.objects)) {
    throw new Error("Unsupported portable export schema");
  }
  for (const object of manifest.objects) {
    const body = entries.get(object.archivePath);
    if (!body) throw new Error(`Portable export object is missing: ${object.archivePath}`);
    const bucket = object.target === "content" ? bindings.CONTENT : bindings.MEDIA;
    await bucket.put(object.r2Key, body, {
      httpMetadata: { contentType: object.contentType, cacheControl: object.cacheControl },
      customMetadata: object.customMetadata,
    });
  }
  return manifest;
}

async function all<T>(env: RuntimeEnv, query: string): Promise<T[]> {
  return (await env.DB.prepare(query).all<T>()).results;
}

async function r2Object(
  bucket: R2Bucket,
  target: PortableObject["target"],
  r2Key: string,
  archivePath: string,
): Promise<PortableObject> {
  const object = await bucket.head(r2Key);
  if (!object) throw new Error(`Export object is missing: ${r2Key}`);
  return {
    target,
    r2Key,
    archivePath,
    byteSize: object.size,
    contentType: object.httpMetadata?.contentType ?? "application/octet-stream",
    cacheControl: object.httpMetadata?.cacheControl,
    customMetadata: object.customMetadata,
  };
}

function r2TarEntry(env: RuntimeEnv, object: PortableObject): TarEntry {
  return {
    path: object.archivePath,
    size: object.byteSize,
    open: async () => {
      const bucket = object.target === "content" ? env.CONTENT : env.MEDIA;
      const body = await bucket.get(object.r2Key);
      if (!body) throw new Error(`Export object is missing: ${object.r2Key}`);
      return body.body;
    },
  };
}

async function listAll(bucket: R2Bucket, prefix: string): Promise<R2Object[]> {
  const objects: R2Object[] = [];
  let cursor: string | undefined;
  do {
    const page = await bucket.list({ prefix, cursor });
    objects.push(...page.objects);
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);
  return objects;
}

function markdownDocument(metadata: Record<string, unknown>, markdown: string): string {
  return `---\nportable_schema: 1\nmetadata: ${JSON.stringify(metadata)}\n---\n\n${markdown.trimEnd()}\n`;
}

function postMetadata(post: PostRow): Record<string, unknown> {
  return {
    id: post.id,
    series: post.series,
    format: post.format,
    status: post.status,
    title: post.title,
    slug: post.slug,
    canonicalPath: post.canonical_path,
    summary: post.summary,
    sourceUrl: post.source_url,
    sourceTitle: post.source_title,
    sourceDescription: post.source_description,
    quoteText: post.quote_text,
    quoteAttribution: post.quote_attribution,
    isListed: post.is_listed !== 0,
    currentRevisionId: post.current_revision_id,
    publishedRevisionId: post.published_revision_id,
    createdAt: post.created_at,
    updatedAt: post.updated_at,
    publishedAt: post.published_at,
  };
}

function revisionMetadata(revision: RevisionRow): Record<string, unknown> {
  return {
    id: revision.id,
    postId: revision.post_id,
    series: revision.series,
    format: revision.format,
    title: revision.title,
    slug: revision.slug,
    canonicalPath: revision.canonical_path,
    summary: revision.summary,
    sourceUrl: revision.source_url,
    sourceTitle: revision.source_title,
    sourceDescription: revision.source_description,
    quoteText: revision.quote_text,
    quoteAttribution: revision.quote_attribution,
    isListed: revision.is_listed !== 0,
    contentHash: revision.content_hash,
    reason: revision.reason,
    createdAt: revision.created_at,
  };
}

function mapPostAsset(row: PostAssetRow): Record<string, unknown> {
  return { assetId: row.asset_id, role: row.role, position: row.position, caption: row.caption };
}

function safeExtension(value: string): string {
  return /^[a-z0-9]{1,10}$/u.test(value) ? value : "bin";
}

function safeName(value: string): string {
  return value.replace(/[^a-z0-9-]+/giu, "-").replace(/^-|-$/gu, "") || "variant";
}

function extensionFor(mimeType: string): string {
  if (mimeType === "image/jpeg") return "jpg";
  return safeExtension(mimeType.split("/").at(-1) ?? "bin");
}

function archiveReadme(): string {
  return `# AamirAzad.com portable content export\n\nThis version 1 archive contains Markdown source, JSON metadata, original media, generated media variants, and the current public projection. It excludes sessions, OIDC transactions, secrets, publish jobs, rate limits, and audit history.\n\nRun \`pnpm rebuild:export -- <archive.tar> <output-directory>\` in the site repository to verify and extract it. See \`build-docs/operations.md\` for the D1-independent recovery procedure.\n`;
}
