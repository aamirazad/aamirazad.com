export const SERIES = ["on", "today", "built", "found"] as const;
export const FORMATS = ["article", "note", "link", "quote", "photo"] as const;

export type Series = (typeof SERIES)[number];
export type PostFormat = (typeof FORMATS)[number];

export type EditablePost = {
  id: string;
  series: Series;
  format: PostFormat;
  status: "draft" | "publishing" | "published" | "scheduled" | "archived" | "failed";
  title: string;
  slug: string;
  canonicalPath: string | null;
  summary: string;
  bodyMarkdown: string;
  sourceUrl: string;
  sourceTitle: string;
  sourceDescription: string;
  quoteText: string;
  quoteAttribution: string;
  isListed: boolean;
  version: number;
  currentRevisionId: string | null;
  publishedRevisionId: string | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
};

export type PostAsset = {
  id: string;
  originalFilename: string;
  mimeType: string;
  byteSize: number;
  width: number | null;
  height: number | null;
  altText: string;
  role: "cover" | "inline" | "gallery" | "attachment";
  position: number;
  caption: string;
};

export type DraftInput = Pick<
  EditablePost,
  | "series"
  | "format"
  | "title"
  | "slug"
  | "summary"
  | "bodyMarkdown"
  | "sourceUrl"
  | "sourceTitle"
  | "sourceDescription"
  | "quoteText"
  | "quoteAttribution"
  | "isListed"
  | "version"
>;

export type ValidationIssue = { field: string; message: string };

const TITLE_PREFIX: Record<Series, string> = {
  on: "On ",
  today: "Today ",
  built: "I Built ",
  found: "I Found ",
};

export function isSeries(value: unknown): value is Series {
  return typeof value === "string" && SERIES.includes(value as Series);
}

export function isPostFormat(value: unknown): value is PostFormat {
  return typeof value === "string" && FORMATS.includes(value as PostFormat);
}

export function titlePrefix(series: Series): string {
  return TITLE_PREFIX[series];
}

export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-+|-+$/gu, "")
    .slice(0, 96);
}

export function validateDraft(
  post: Omit<DraftInput, "version">,
  options: { forPublication?: boolean; assets?: PostAsset[] } = {},
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const required = options.forPublication === true;

  if (!isSeries(post.series)) issues.push({ field: "series", message: "Choose a series." });
  if (!isPostFormat(post.format)) issues.push({ field: "format", message: "Choose a format." });
  if (required && post.title.trim().length === 0) {
    issues.push({ field: "title", message: "Add a title before publishing." });
  }
  if (post.title.length > 180)
    issues.push({ field: "title", message: "Keep the title under 180 characters." });
  if (post.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(post.slug)) {
    issues.push({ field: "slug", message: "Use lowercase letters, numbers, and hyphens." });
  }
  if (post.summary.length > 500) {
    issues.push({ field: "summary", message: "Keep the summary under 500 characters." });
  }
  if (post.bodyMarkdown.length > 250_000) {
    issues.push({ field: "bodyMarkdown", message: "The Markdown body is too large." });
  }

  if (
    (post.format === "article" || post.format === "note") &&
    required &&
    !post.bodyMarkdown.trim()
  ) {
    issues.push({ field: "bodyMarkdown", message: "Add some Markdown before publishing." });
  }
  if (post.format === "link") {
    if (required && !post.sourceUrl.trim()) {
      issues.push({ field: "sourceUrl", message: "Add the destination URL." });
    } else if (post.sourceUrl && !isSafePublicUrl(post.sourceUrl)) {
      issues.push({ field: "sourceUrl", message: "Use a public HTTP or HTTPS URL." });
    }
  }
  if (post.format === "quote" && required && !post.quoteText.trim()) {
    issues.push({ field: "quoteText", message: "Add the quoted text." });
  }
  if (post.format === "photo" && required) {
    const assets = options.assets ?? [];
    if (assets.length === 0)
      issues.push({ field: "assets", message: "Upload at least one photo." });
    for (const asset of assets) {
      if (!asset.altText.trim()) {
        issues.push({
          field: `asset-${asset.id}`,
          message: `${asset.originalFilename} needs alt text.`,
        });
      }
    }
  }
  return issues;
}

export function isSafePublicUrl(value: string): boolean {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/gu, "");
    if (
      hostname === "localhost" ||
      hostname.endsWith(".localhost") ||
      hostname.endsWith(".local")
    ) {
      return false;
    }
    const ipv4 = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/u);
    if (ipv4) {
      const [first, second] = ipv4.slice(1).map(Number);
      if (
        first === 0 ||
        first === 10 ||
        first === 127 ||
        (first === 169 && second === 254) ||
        (first === 172 && second >= 16 && second <= 31) ||
        (first === 192 && second === 168)
      ) {
        return false;
      }
    }
    if (/^(?:fc|fd|fe[89ab]|ff|::1|::ffff:)/u.test(hostname)) return false;
    return (
      (url.protocol === "https:" || url.protocol === "http:") && !url.username && !url.password
    );
  } catch {
    return false;
  }
}

export function parseDraftInput(value: unknown): DraftInput | null {
  if (!value || typeof value !== "object") return null;
  const input = value as Record<string, unknown>;
  if (!isSeries(input.series) || !isPostFormat(input.format) || !Number.isInteger(input.version)) {
    return null;
  }
  const fields = [
    "title",
    "slug",
    "summary",
    "bodyMarkdown",
    "sourceUrl",
    "sourceTitle",
    "sourceDescription",
    "quoteText",
    "quoteAttribution",
  ] as const;
  if (fields.some((field) => typeof input[field] !== "string")) return null;
  const isListed = parseBoolean(input.isListed, true);
  if (isListed === null) return null;
  return {
    series: input.series,
    format: input.format,
    title: String(input.title).slice(0, 180),
    slug: String(input.slug).slice(0, 96),
    summary: String(input.summary).slice(0, 500),
    bodyMarkdown: String(input.bodyMarkdown).slice(0, 250_000),
    sourceUrl: String(input.sourceUrl).slice(0, 2_048),
    sourceTitle: String(input.sourceTitle).slice(0, 500),
    sourceDescription: String(input.sourceDescription).slice(0, 2_000),
    quoteText: String(input.quoteText).slice(0, 10_000),
    quoteAttribution: String(input.quoteAttribution).slice(0, 500),
    isListed,
    version: Number(input.version),
  };
}

function parseBoolean(value: unknown, fallback: boolean): boolean | null {
  if (value === undefined) return fallback;
  if (value === true || value === "true" || value === 1 || value === "1") return true;
  if (value === false || value === "false" || value === 0 || value === "0") return false;
  return null;
}
