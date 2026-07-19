# Production Cutover Record

Cutover date: 2026-07-18 (America/New_York).

## Pre-cutover baseline and backup

Before the route change, `aamirazad.com` and `www.aamirazad.com` were served by the retained Vercel deployment:

- Apex returned `307` to `https://www.aamirazad.com/` with an `x-vercel-id` response header.
- `www` returned the Astro homepage with `200` and `x-vercel-cache: HIT`.
- `/feed.xml` returned `404`; `/sitemap.xml` returned `200`.
- The immutable source reference for that deployment is Git commit `f54c39848096e232245b72c8facd57bde2b919f9`.
- The same Astro source and lockfile remain locally in ignored `old-site/` for rapid inspection and rebuilding.
- The Vercel project/deployment was retained during the initial cutover, then removed from DNS after the Worker became the production origin.

The production Cloudflare resources were staged before routing traffic:

- All required production secret names were present: `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`, `OIDC_DISCOVERY_URL`, `OIDC_OWNER_SUB`, and `SESSION_SECRET`. Values were not read or printed.
- D1 migrations `0001`, `0002`, and `0003` were applied successfully to `personal-site`.
- The SvelteKit Worker was deployed without public routes as version `b92a470e-0190-4aaa-9f34-c701d971abfe` with a 27 ms startup time.
- Preview remained available at `preview.aamirazad.com` throughout the cutover.

## Route design

The initial cutover used `aamirazad.com/*` and `www.aamirazad.com/*` zone Routes in front of the existing proxied Vercel DNS records. After the Vercel DNS records were removed, production migrated to Worker Custom Domains for `aamirazad.com` and `www.aamirazad.com`. Cloudflare now manages their origin DNS records and certificates, and the Worker is the origin for every path.

The apex is canonical. Production requests arriving on `www` receive a cacheable `308` to the same path and query on the apex; preview and local development keep their existing origin normalization behavior.

On 2026-07-18, the apex briefly served a cached `308` redirect to itself while the dashboard routing and DNS configuration were being changed. A cache-busting request confirmed the current Worker returned `200`; the poisoned cache entry was purged through the Worker's cache binding. Production was then redeployed as stable version `40083921-69a0-419c-8f1a-5af551fcfd8d` with only the two Custom Domain triggers. The bare apex subsequently returned `200` first as `MISS` and then as `HIT`.

## Cutover smoke checklist

- Homepage returns `200` from the Worker on the apex.
- `www` redirects to the exact apex path and query.
- Every legacy redirect in `src/lib/legacy-redirects.ts` still passes the automated baseline.
- `/feed.xml`, `/feed.json`, `/sitemap.xml`, `/robots.txt`, `/favicon.svg`, and `/ssh` respond with expected types.
- `/admin` redirects through the production Pocket ID client with `returnTo=/admin` and `private, no-store`.
- Anonymous `/api/posts` is `401 private, no-store`.
- Public responses contain the security headers and become cache hits without session-dependent content.
- Production D1 reports no pending migrations.
- A publication/archive lifecycle completes and leaves no temporary public post.

## Rollback

For an application regression after a subsequent Worker deployment, use Wrangler's production deployment history to roll traffic back to the last known-good Worker version, then repeat the public smoke checklist.

Vercel is no longer an origin-level rollback because its DNS records have been removed. If a failure cannot be resolved by rolling back the Worker:

1. Roll back to an inspected, known-good `aamirazad-com` production version with Wrangler.
2. Verify the apex homepage, `www` redirect, legacy redirects, feeds, sitemap, authentication boundary, and cache behavior.
3. For disaster recovery outside Workers, check out `f54c39848096e232245b72c8facd57bde2b919f9`, install its locked dependencies, rebuild the Astro application, and deliberately provision a new origin before changing either Custom Domain.

Do not remove the Git source reference until production publication, archive, export, and recovery have been exercised successfully.
