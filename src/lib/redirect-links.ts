export type RedirectLink = {
  id: string;
  path: string;
  targetUrl: string;
  label: string;
  allTimeClicks: number;
  last24HoursClicks: number;
  version: number;
  createdAt: string;
  updatedAt: string;
};

export type RedirectLinkInput = Pick<RedirectLink, "path" | "targetUrl" | "label"> & {
  version?: number;
};

const RESERVED_PATHS = [
  "/admin",
  "/api",
  "/auth",
  "/preview",
  "/media",
  "/archive",
  "/feed.xml",
  "/feed.json",
  "/sitemap.xml",
  "/on",
  "/today",
  "/built",
  "/found",
  "/favicon.svg",
  "/robots.txt",
  "/ssh",
];

export function parseRedirectLinkInput(value: unknown): RedirectLinkInput | null {
  if (!value || typeof value !== "object") return null;
  const input = value as Record<string, unknown>;
  if (
    typeof input.path !== "string" ||
    typeof input.targetUrl !== "string" ||
    typeof input.label !== "string" ||
    (input.version !== undefined && (!Number.isInteger(input.version) || Number(input.version) < 1))
  ) {
    return null;
  }
  return {
    path: input.path.trim().slice(0, 180),
    targetUrl: input.targetUrl.trim().slice(0, 2_048),
    label: input.label.trim().slice(0, 180),
    version: input.version === undefined ? undefined : Number(input.version),
  };
}

export function validateRedirectLinkInput(input: RedirectLinkInput): string | null {
  if (!input.path.startsWith("/")) return "The short path must start with a slash.";
  if (
    input.path.length < 2 ||
    input.path.includes("//") ||
    /[?#\s]/u.test(input.path) ||
    RESERVED_PATHS.some(
      (reserved) => input.path === reserved || input.path.startsWith(`${reserved}/`),
    ) ||
    legacyRedirectFor(input.path)
  ) {
    return "Use an unused public path without spaces, query parameters, or fragments.";
  }
  try {
    const url = new URL(input.targetUrl);
    if (!/^https?:$/u.test(url.protocol) || url.username || url.password) {
      return "The destination must be a public HTTP or HTTPS URL.";
    }
  } catch {
    return "The destination must be a public HTTP or HTTPS URL.";
  }
  return null;
}
import { legacyRedirectFor } from "$lib/legacy-redirects";
