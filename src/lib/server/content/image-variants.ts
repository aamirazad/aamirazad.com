import sharp from "sharp";

import { sha256Hex } from "$lib/server/crypto";
import type { RuntimeEnv } from "$lib/server/env";

export type StoredImageVariant = {
  name: string;
  storageKey: string;
  contentHash: string;
  width: number;
  height: number;
  mimeType: string;
  byteSize: number;
};

type VariantRow = {
  variant: string;
  storage_key: string;
  content_hash: string;
  width: number;
  height: number;
  mime_type: string;
  byte_size: number;
};

type SourceAsset = {
  id: string;
  originalKey: string;
  mimeType: string;
  width: number | null;
  height: number | null;
};

type OutputFormat = "image/webp" | "image/jpeg" | "image/png" | "image/gif";

const RESPONSIVE_WIDTHS = [480, 960, 1_600] as const;
const IMMUTABLE_SECONDS = 31_536_000;

export async function ensureImageVariants(
  env: RuntimeEnv,
  asset: SourceAsset,
): Promise<StoredImageVariant[]> {
  if (!asset.width || !asset.height) return [];
  const existing = await listVariants(env, asset.id);
  const targetWidths = [
    ...new Set(RESPONSIVE_WIDTHS.map((width) => Math.min(width, asset.width!))),
  ];
  const required: { name: string; width: number; mimeType: OutputFormat }[] = [
    ...targetWidths.map((width) => ({
      name: `${width}w-webp`,
      width,
      mimeType: "image/webp" as const,
    })),
    {
      name: "fallback",
      width: targetWidths.at(-1) ?? asset.width,
      mimeType: fallbackMimeType(asset.mimeType),
    },
  ];
  const missing = required.filter((target) => !existing.some((item) => item.name === target.name));
  if (missing.length === 0) return sortVariants(existing);

  const original = await env.MEDIA.get(asset.originalKey);
  if (!original) throw new Error(`Original image is missing: ${asset.id}`);
  const source = new Uint8Array(await new Response(original.body).arrayBuffer());
  const animated = asset.mimeType === "image/gif" || asset.mimeType === "image/webp";

  for (const target of missing) {
    const bytes = new Uint8Array(await transform(source, target.width, target.mimeType, animated));
    const contentHash = await sha256Hex(bytes);
    const extension = extensionFor(target.mimeType);
    const storageKey = `media/variants/${asset.id}/${contentHash}/${target.name}.${extension}`;
    const width = target.width;
    const height = Math.max(1, Math.round((asset.height * width) / asset.width));
    await env.MEDIA.put(storageKey, bytes, {
      contentType: target.mimeType,
      cacheControlMaxAge: IMMUTABLE_SECONDS,
    });
    await env.DB.run(
      `INSERT INTO aamirazad_asset_variants
      (asset_id, variant, storage_key, width, height, mime_type, byte_size, content_hash, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT DO NOTHING`,
      asset.id,
      target.name,
      storageKey,
      width,
      height,
      target.mimeType,
      bytes.byteLength,
      contentHash,
      new Date().toISOString(),
    );
  }

  return sortVariants(await listVariants(env, asset.id));
}

async function transform(
  source: Uint8Array,
  width: number,
  format: OutputFormat,
  animated: boolean,
): Promise<Buffer> {
  // `rotate()` applies the EXIF orientation; metadata (including location) is stripped by default.
  const image = sharp(source, { animated }).rotate().resize({ width, withoutEnlargement: true });
  switch (format) {
    case "image/webp":
      return image.webp({ quality: 82 }).toBuffer();
    case "image/jpeg":
      return image.jpeg({ quality: 82, mozjpeg: true }).toBuffer();
    case "image/png":
      return image.png().toBuffer();
    case "image/gif":
      return image.gif().toBuffer();
  }
}

async function listVariants(env: RuntimeEnv, assetId: string): Promise<StoredImageVariant[]> {
  const rows = await env.DB.all<VariantRow>(
    `SELECT variant, storage_key, content_hash, width, height, mime_type, byte_size
    FROM aamirazad_asset_variants WHERE asset_id = $1 ORDER BY width, variant`,
    assetId,
  );
  return rows.map((row) => ({
    name: row.variant,
    storageKey: row.storage_key,
    contentHash: row.content_hash,
    width: row.width,
    height: row.height,
    mimeType: row.mime_type,
    byteSize: row.byte_size,
  }));
}

function sortVariants(variants: StoredImageVariant[]): StoredImageVariant[] {
  return variants.toSorted(
    (left, right) => left.width - right.width || left.name.localeCompare(right.name),
  );
}

function fallbackMimeType(mimeType: string): OutputFormat {
  if (
    mimeType === "image/jpeg" ||
    mimeType === "image/png" ||
    mimeType === "image/gif" ||
    mimeType === "image/webp"
  ) {
    return mimeType;
  }
  return "image/jpeg";
}

function extensionFor(mimeType: string): string {
  return mimeType === "image/jpeg" ? "jpg" : mimeType.slice("image/".length);
}
