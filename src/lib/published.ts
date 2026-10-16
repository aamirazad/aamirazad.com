import type { PostFormat, Series } from "$lib/content";

export type PublishedPost = {
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
  isListed: boolean;
  html: string;
  publishedAt: string;
  modifiedAt: string;
};

export type PublishedCard = Pick<
  PublishedPost,
  "id" | "series" | "format" | "title" | "canonicalPath" | "summary" | "publishedAt" | "modifiedAt"
>;

export type PublishedIndex = {
  page: number;
  totalPages: number;
  items: PublishedCard[];
};

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

/** Tags for every public response that can show a post at one of `paths`. */
export function cacheTagsForPostPaths(paths: string[]): string[] {
  const series = paths.map((path) => path.split("/").filter(Boolean)[0]).filter(Boolean);
  return [
    ...new Set([
      ...paths.map(cacheTagForPath),
      ...series.map((name) => `series-${name}`),
      "home",
      "archive",
      "feeds",
      "sitemap",
    ]),
  ];
}

export function publishedPostWasEdited(
  post: Pick<PublishedPost, "publishedAt" | "modifiedAt">,
): boolean {
  return Date.parse(post.modifiedAt) > Date.parse(post.publishedAt);
}
