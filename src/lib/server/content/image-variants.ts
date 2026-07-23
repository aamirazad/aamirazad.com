import { sha256Hex } from "$lib/server/crypto";
import type { RuntimeEnv } from "$lib/server/env";

export type StoredImageVariant = {
  name: string;
  r2Key: string;
  contentHash: string;
  width: number;
  height: number;
  mimeType: string;
  byteSize: number;
};

type VariantRow = {
  variant: string;
  r2_key: string;
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

const RESPONSIVE_WIDTHS = [480, 960, 1_600] as const;

export async function ensureImageVariants(
  env: RuntimeEnv,
  asset: SourceAsset,
): Promise<StoredImageVariant[]> {
  if (!asset.width || !asset.height) return [];
  const existing = await listVariants(env, asset.id);
  const targetWidths = [
    ...new Set(RESPONSIVE_WIDTHS.map((width) => Math.min(width, asset.width!))),
  ];
  const required = [
    ...targetWidths.map((width) => ({ name: `${width}w-webp`, width, mimeType: "image/webp" })),
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
  const source = await original.arrayBuffer();

  for (const target of missing) {
    const transformed = await env.IMAGES.input(new Blob([source]).stream())
      .transform({ width: target.width, fit: "scale-down" })
      .output({
        format: target.mimeType as ImageOutputOptions["format"],
        quality:
          target.mimeType === "image/png" || target.mimeType === "image/gif" ? undefined : 82,
        anim: asset.mimeType === "image/gif",
      });
    const bytes = new Uint8Array(await new Response(transformed.image()).arrayBuffer());
    const contentHash = await sha256Hex(bytes);
    const extension = extensionFor(target.mimeType);
    const r2Key = `media/variants/${asset.id}/${contentHash}/${target.name}.${extension}`;
    const width = target.width;
    const height = Math.max(1, Math.round((asset.height * width) / asset.width));
    await env.MEDIA.put(r2Key, bytes, {
      httpMetadata: {
        contentType: target.mimeType,
        cacheControl: "public, max-age=31536000, immutable",
      },
      customMetadata: { sourceAssetId: asset.id, contentHash },
    });
    await env.DB.prepare(
      `INSERT OR IGNORE INTO asset_variants
      (asset_id, variant, r2_key, width, height, mime_type, byte_size, content_hash, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        asset.id,
        target.name,
        r2Key,
        width,
        height,
        target.mimeType,
        bytes.byteLength,
        contentHash,
        new Date().toISOString(),
      )
      .run();
  }

  return sortVariants(await listVariants(env, asset.id));
}

async function listVariants(env: RuntimeEnv, assetId: string): Promise<StoredImageVariant[]> {
  const result = await env.DB.prepare(
    `SELECT variant, r2_key, content_hash, width, height, mime_type, byte_size
    FROM asset_variants WHERE asset_id = ? ORDER BY width, variant`,
  )
    .bind(assetId)
    .all<VariantRow>();
  return result.results.map((row) => ({
    name: row.variant,
    r2Key: row.r2_key,
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

function fallbackMimeType(mimeType: string): ImageOutputOptions["format"] {
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
