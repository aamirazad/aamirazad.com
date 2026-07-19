import type { PostFormat, Series } from "$lib/content";

export type PublishedAsset = {
  id: string;
  originalKey: string;
  originalFilename: string;
  mimeType: string;
  byteSize: number;
  width: number | null;
  height: number | null;
  altText: string;
  caption: string;
  position: number;
  sha256: string;
};

export type PublishedPost = {
  schemaVersion: 1;
  id: string;
  revisionId: string;
  contentHash: string;
  series: Series;
  format: PostFormat;
  title: string;
  slug: string;
  canonicalPath: string;
  summary: string;
  sourceUrl: string;
  sourceTitle: string;
  sourceDescription: string;
  quoteText: string;
  quoteAttribution: string;
  bodyMarkdown: string;
  html: string;
  assets: PublishedAsset[];
  publishedAt: string;
  modifiedAt: string;
};

export type PublishedCard = Pick<
  PublishedPost,
  "id" | "series" | "format" | "title" | "canonicalPath" | "summary" | "publishedAt" | "modifiedAt"
>;

export type ProjectionManifest = {
  schemaVersion: 1;
  generation: string;
  updatedAt: string;
  paths: Record<string, string>;
  aliases: Record<string, string>;
  media: Record<
    string,
    { originalKey: string; mimeType: string; originalFilename: string; sha256: string }
  >;
};

export type PublishedIndex = {
  schemaVersion: 1;
  title: string;
  page: number;
  totalPages: number;
  items: PublishedCard[];
};

export const CURRENT_PROJECTION_KEY = "published/current.json";

export function revisionKey(postId: string, revisionId: string): string {
  return `published/revisions/${postId}/${revisionId}.json`;
}

export function projectionKey(generation: string, path: string): string {
  return `published/projections/${generation}/${path}`;
}

export function cacheTagForPath(path: string): string {
  return `path-${encodeURIComponent(path).slice(0, 900)}`;
}

export function cacheTagsForPath(path: string): string[] {
  const tags = ["site", cacheTagForPath(path)];
  if (path === "/") tags.push("home");
  if (path === "/archive") tags.push("archive");
  if (path === "/feed.xml" || path === "/feed.json") tags.push("feeds");
  if (path === "/sitemap.xml") tags.push("sitemap");
  const first = path.split("/").filter(Boolean)[0];
  if (first && ["on", "today", "built", "found"].includes(first)) tags.push(`series-${first}`);
  return tags;
}
