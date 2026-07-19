# Production Cutover Record

Cutover date: 2026-07-18 (America/New_York).

## Pre-cutover baseline and backup

Before the route change, `aamirazad.com` and `www.aamirazad.com` were served by the retained Vercel deployment:

- Apex returned `307` to `https://www.aamirazad.com/` with an `x-vercel-id` response header.
- `www` returned the Astro homepage with `200` and `x-vercel-cache: HIT`.
- `/feed.xml` returned `404`; `/sitemap.xml` returned `200`.
- The immutable source reference for that deployment is Git commit `f54c39848096e232245b72c8facd57bde2b919f9`.
- The same Astro source and lockfile remain locally in ignored `old-site/` for rapid inspection and rebuilding.
- The Vercel project/deployment is not deleted during cutover.

The production Cloudflare resources were staged before routing traffic:

- All required production secret names were present: `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`, `OIDC_DISCOVERY_URL`, `OIDC_OWNER_SUB`, and `SESSION_SECRET`. Values were not read or printed.
- D1 migrations `0001`, `0002`, and `0003` were applied successfully to `personal-site`.
- The SvelteKit Worker was deployed without public routes as version `b92a470e-0190-4aaa-9f34-c701d971abfe` with a 27 ms startup time.
- Preview remained available at `preview.aamirazad.com` throughout the cutover.

## Route design

Both `aamirazad.com` and `www.aamirazad.com` are attached as Worker Custom Domains. The apex is canonical. Production requests arriving on `www` receive a cacheable `308` to the same path and query on the apex; preview and local development keep their existing origin normalization behavior.

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

For an initial-cutover failure that requires the Astro site:

1. Remove the `aamirazad.com` and `www.aamirazad.com` Custom Domains from `aamirazad-com` so the Worker no longer owns them.
2. In Vercel, re-confirm both domains on the retained project and use the exact DNS values Vercel displays for that project; restore those records in Cloudflare DNS with the previous proxy setting.
3. Verify apex→www, homepage, legacy redirects, and sitemap responses contain `x-vercel-id` again.
4. If the retained deployment must be rebuilt, check out `f54c39848096e232245b72c8facd57bde2b919f9`, install its locked dependencies, and build the Astro application.

Do not delete the Vercel project or the Git source reference until production publication, archive, export, and recovery have been exercised successfully and the Cloudflare Worker is the accepted rollback target.
