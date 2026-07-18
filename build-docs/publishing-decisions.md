# Publishing decisions and baseline

Recorded 2026-07-18 for Phase 0 of the publishing-platform plan.

## Decisions

- Cost baseline: Cloudflare Workers Free. The implementation must stay within the current 100,000 dynamic requests per day and 10 ms CPU per request. Static asset requests are free and unlimited. D1 Free currently permits 10 databases, 500 MB per database, 5 GB per account, 50 queries per Worker invocation, and seven days of Time Travel.
- Project title convention: `I Built ...`.
- Preview hostname: `preview.aamirazad.com`.
- Production hostname: `aamirazad.com`.
- Provider-independent export: the portable Markdown export is mirrored to the site's Git remote. Original media is synchronized to an S3-compatible off-provider destination configured by encrypted Worker secrets.
- Photo privacy: preserve private originals; strip sensitive EXIF metadata from public derivatives.
- Dates: allow backdating; show publication and modification dates on public entries.
- Archived canonical URLs return `410 Gone`. Unknown URLs return `404 Not Found`.

## Existing public surface

The committed baseline inventories the homepage metadata/headings, 30 redirect endpoints, two machine-readable routes, and five static compatibility routes. The migration source is retained locally under `old-site/` only as a content and visual reference; the new application does not import or build it.

The former site is a single server-rendered Astro homepage with no required browser JavaScript, a system-font dark theme, a 760 px content column, and the title/description captured in `baseline/public-surface.json`. The replacement may improve typography and navigation, but must retain all contact, project, homelab, metadata, and redirect content.

## Performance baseline and budgets

The old implementation's useful repeatable baseline is architectural: static HTML, no required JavaScript, no third-party render-blocking resources, and one small stylesheet. The production URL was not reliably reachable from the implementation environment during Phase 0, so network timing is intentionally not treated as reproducible evidence.

The replacement is held to the stricter budgets in the technical plan: no required public JavaScript, at most 20 KB compressed optional first-party JavaScript, at most 35 KB compressed route CSS, no render-blocking third-party requests, explicit image dimensions, cached p75 response below 100 ms, and uncached R2-backed p95 below 500 ms.

Run the baseline invariant check with:

```sh
node scripts/verify-baseline.mjs
```
