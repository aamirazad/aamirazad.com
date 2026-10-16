import { imageSize } from "image-size";

import type { PostAsset } from "$lib/content";
import { sha256Hex, uuidV7 } from "$lib/server/crypto";
import type { RuntimeEnv } from "$lib/server/env";
import { ensureImageVariants } from "$lib/server/content/image-variants";

const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
]);

async function storeImage(
  env: RuntimeEnv,
  postId: string,
  file: File,
  actor: string,
): Promise<PostAsset> {
  const extension = ALLOWED_IMAGE_TYPES.get(file.type);
  if (!extension) throw new Error("Upload a JPEG, PNG, WebP, or GIF image.");
  if (file.size <= 0 || file.size > MAX_UPLOAD_BYTES)
    throw new Error("Images must be 12 MB or smaller.");

  const post = await env.DB.prepare(
    "SELECT id FROM posts WHERE id = ? AND deleted_at IS NULL LIMIT 1",
  )
    .bind(postId)
    .first<{ id: string }>();
  if (!post) throw new Error("Post not found");

  const bytes = new Uint8Array(await file.arrayBuffer());
  let dimensions: { width?: number; height?: number } = {};
  try {
    dimensions = imageSize(bytes);
  } catch {
    throw new Error("The uploaded file is not a valid supported image.");
  }
  const assetId = uuidV7();
  const filename = safeFilename(file.name, extension);
  const originalKey = `media/originals/${assetId}/${filename}`;
  const digest = await sha256Hex(bytes);
  const now = new Date().toISOString();
  const positionRow = await env.DB.prepare(
    "SELECT COALESCE(MAX(position), -1) + 1 AS position FROM post_assets WHERE post_id = ?",
  )
    .bind(postId)
    .first<{ position: number }>();
  const position = positionRow?.position ?? 0;

  const stored = await env.MEDIA.put(originalKey, bytes, {
    httpMetadata: { contentType: file.type, cacheControl: "private, no-store" },
    customMetadata: { sha256: digest, originalFilename: filename },
  });
  if (!stored) throw new Error("Image storage rejected the upload.");

  try {
    await env.DB.batch([
      env.DB.prepare(
        `INSERT INTO assets (id, original_key, sha256, original_filename, extension,
        mime_type, byte_size, width, height, alt_text, created_at, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).bind(
        assetId,
        originalKey,
        digest,
        filename,
        extension,
        file.type,
        file.size,
        dimensions.width ?? null,
        dimensions.height ?? null,
        "",
        now,
        actor,
      ),
      env.DB.prepare(
        `INSERT INTO post_assets (post_id, asset_id, role, position, caption)
        VALUES (?, ?, 'inline', ?, NULL)`,
      ).bind(postId, assetId, position),
      env.DB.prepare(
        `INSERT INTO audit_events (id, actor_subject, event_type, target_id, created_at)
        VALUES (?, ?, 'asset.uploaded', ?, ?)`,
      ).bind(uuidV7(), actor, assetId, now),
    ]);
  } catch (error) {
    await env.MEDIA.delete(originalKey);
    throw error;
  }

  return {
    id: assetId,
    originalFilename: filename,
    mimeType: file.type,
    byteSize: file.size,
    width: dimensions.width ?? null,
    height: dimensions.height ?? null,
    altText: "",
    role: "inline",
    position,
    caption: "",
  };
}

/** Store an uploaded image, generate its responsive variants, and return Markdown that embeds it. */
export async function uploadPostImage(
  env: RuntimeEnv,
  postId: string,
  file: File,
  actor: string,
): Promise<{ asset: PostAsset; markdown: string }> {
  const asset = await storeImage(env, postId, file, actor);
  const postAsset = await env.DB.prepare(
    `SELECT id, original_key AS originalKey, mime_type AS mimeType,
    width, height FROM assets WHERE id = ? LIMIT 1`,
  )
    .bind(asset.id)
    .first<{
      id: string;
      originalKey: string;
      mimeType: string;
      width: number | null;
      height: number | null;
    }>();
  if (!postAsset) throw new Error("Uploaded image metadata is unavailable.");
  const variants = await ensureImageVariants(env, postAsset);
  const webp = variants.filter((variant) => variant.mimeType === "image/webp").at(-1);
  if (!webp) throw new Error("The image could not be compressed to WebP.");
  const alt = markdownText(asset.originalFilename.replace(/\.[^.]+$/u, ""));
  const url = `/media/${encodeURIComponent(asset.id)}/${encodeURIComponent(webp.contentHash)}/${encodeURIComponent(webp.name)}`;
  return { asset, markdown: `![${alt}](${url})` };
}

function safeFilename(input: string, extension: string): string {
  const base =
    input
      .replace(/\.[^.]+$/u, "")
      .normalize("NFKD")
      .toLowerCase()
      .replace(/[^a-z0-9]+/gu, "-")
      .replace(/^-+|-+$/gu, "")
      .slice(0, 80) || "image";
  return `${base}.${extension}`;
}

function markdownText(value: string): string {
  return value.replace(/([\\\[\]])/gu, "\\$1");
}
