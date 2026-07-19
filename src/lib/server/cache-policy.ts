const PUBLIC_BROWSER_TTL = 60;
const PUBLIC_EDGE_TTL = 3_600;
const PUBLIC_STALE_TTL = 604_800;
const IMMUTABLE_TTL = 31_536_000;

export type PublicCachePolicy = {
  browser: string;
  edge: string;
};

export function publicCachePolicy(pathname: string): PublicCachePolicy {
  if (pathname.startsWith("/media/")) {
    const immutable = `public, max-age=${IMMUTABLE_TTL}, immutable`;
    return { browser: immutable, edge: immutable };
  }

  return {
    browser: `public, max-age=${PUBLIC_BROWSER_TTL}, stale-while-revalidate=${PUBLIC_STALE_TTL}, stale-if-error=${PUBLIC_STALE_TTL}`,
    edge: `public, max-age=${PUBLIC_EDGE_TTL}, stale-while-revalidate=${PUBLIC_STALE_TTL}, stale-if-error=${PUBLIC_STALE_TTL}`,
  };
}
