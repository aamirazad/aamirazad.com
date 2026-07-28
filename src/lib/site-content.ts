export const SITE_ITEM_KINDS = ["project", "link", "homelab"] as const;

export type SiteItemKind = (typeof SITE_ITEM_KINDS)[number];

export type SiteItem = {
  id: string;
  kind: SiteItemKind;
  name: string;
  description: string;
  href: string;
  github: string;
  codeUrl: string;
  badge: string;
  isWip: boolean;
  position: number;
  version: number;
  createdAt: string;
  updatedAt: string;
};

export type SiteItemInput = Pick<
  SiteItem,
  "kind" | "name" | "description" | "href" | "github" | "codeUrl" | "badge" | "isWip"
> & {
  version?: number;
};

export function isSiteItemKind(value: unknown): value is SiteItemKind {
  return typeof value === "string" && SITE_ITEM_KINDS.includes(value as SiteItemKind);
}

export function parseSiteItemInput(value: unknown): SiteItemInput | null {
  if (!value || typeof value !== "object") return null;
  const input = value as Record<string, unknown>;
  if (!isSiteItemKind(input.kind) || typeof input.name !== "string") return null;
  const stringFields = ["description", "href", "github", "codeUrl", "badge"] as const;
  if (stringFields.some((field) => typeof input[field] !== "string")) return null;
  if (typeof input.isWip !== "boolean") return null;
  if (
    input.version !== undefined &&
    (!Number.isInteger(input.version) || Number(input.version) < 1)
  ) {
    return null;
  }
  return {
    kind: input.kind,
    name: input.name.trim().slice(0, 180),
    description: String(input.description).trim().slice(0, 2_000),
    href: String(input.href).trim().slice(0, 2_048),
    github: String(input.github).trim().slice(0, 500),
    codeUrl: String(input.codeUrl).trim().slice(0, 2_048),
    badge: String(input.badge).trim().slice(0, 80),
    isWip: input.isWip,
    version: input.version === undefined ? undefined : Number(input.version),
  };
}

export function validateSiteItemInput(input: SiteItemInput): string | null {
  if (!input.name) return "Add a name or label.";
  if (input.href && !isSafeSiteHref(input.href)) {
    return "Use a relative path, mailto address, or public HTTP/HTTPS URL.";
  }
  if (input.codeUrl && !isSafeHttpUrl(input.codeUrl)) {
    return "Use a public HTTP or HTTPS URL for the code link.";
  }
  return null;
}

function isSafeSiteHref(value: string): boolean {
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  if (/^mailto:[^@\s]+@[^@\s]+$/iu.test(value)) return true;
  return isSafeHttpUrl(value);
}

function isSafeHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      (url.protocol === "https:" || url.protocol === "http:") && !url.username && !url.password
    );
  } catch {
    return false;
  }
}
