# Publishing Operations

## Where things run

| Concern        | Service                                                                       |
| -------------- | ----------------------------------------------------------------------------- |
| App            | Vercel project `aamirazad-com` (SvelteKit, Node.js 24 functions in `iad1`)    |
| Database       | Neon store `postgres` (Neon project `shy-tree-28765803`), shared with `track` |
| Media          | Private Vercel Blob store `aamirazad-com-media`, served through `/media/...`  |
| CDN cache      | Vercel CDN, purged by cache tag when a post changes                           |
| DNS            | Cloudflare zone `aamirazad.com` (DNS only; apex and `www` point at Vercel)    |
| Authentication | Pocket ID at `auth.aamirazad.com`                                             |

The Neon database is shared, so every object this site creates is prefixed `aamirazad_`
(tables, indexes, the revision-immutability trigger and its function). `track` uses `track_` and
its Drizzle config only manages `track_*` tables. Never run unprefixed DDL against this database.

## How publishing works

Drafts live in `aamirazad_posts`. Publishing renders the Markdown, stores an immutable
`aamirazad_post_revisions` row (including its HTML), and points `published_revision_id` at it in a
single transaction. Public pages, feeds, the sitemap, and media all read Postgres directly through
Neon's HTTP driver.

Public responses carry `Cache-Control` for browsers, `Vercel-CDN-Cache-Control` for the CDN, and
`Vercel-Cache-Tag` (see `cacheTagsForPath`). Publishing, unpublishing, or deleting a post calls
`invalidateByTag` for the affected tags; if that fails, CDN copies expire within the edge TTL (one
hour). Purge everything manually with `vercel cache invalidate --tag site`.

Uploaded images are stored privately in Blob; `sharp` generates responsive WebP variants (and a
same-format fallback) on upload, stripping metadata.

## Deployment

Vercel's Git integration deploys every push: `main` goes to production on `aamirazad.com` and
`www.aamirazad.com`, and every other branch gets a preview deployment on a `*.vercel.app` URL.
Preview deployments use the same database and Blob store as production. They do not run
migrations, but the admin on a preview edits real content.

## Migrations

Migrations are plain SQL files in `migrations/`, applied in filename order and recorded in
`aamirazad_schema_migrations`. A production build runs `node scripts/migrate.mjs --if-production`
before `vite build`, so merging a migration to `main` applies it ahead of the new code. Keep
migrations backwards compatible with the code that is still serving while the build runs.

To inspect or apply migrations manually:

```sh
vercel env pull .env.production.local --environment production
node --env-file=.env.production.local scripts/migrate.mjs --list
node --env-file=.env.production.local scripts/migrate.mjs
```

Local development (`pnpm dev`) and tests never touch Neon: without `DATABASE_URL` they use an
embedded PGlite database (`.pglite/` for dev, in-memory for tests) with the same migrations, and an
in-memory media store.

## Secrets and configuration

Set on the Vercel project for Production and Preview:

- `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, and the other `PG*`/`POSTGRES_*` variables, managed by
  the Neon integration.
- `BLOB_READ_WRITE_TOKEN`, managed by the Blob store connection.
- `APP_ORIGIN` (`https://aamirazad.com`), `OIDC_DISCOVERY_URL`, `OIDC_OWNER_SUB`, `SESSION_SECRET`.
- `OIDC_CLIENT_ID` and `OIDC_CLIENT_SECRET` for the Pocket ID client.

Rotating `SESSION_SECRET` signs out every session. Pocket ID must allow
`https://aamirazad.com/auth/callback`; preview deployments use their own `*.vercel.app` origin
for the callback, so they can only sign in if that origin is registered too.

## Recovery

Neon keeps point-in-time history for the branch; restore from the Neon console (open it with
`vercel integration open neon postgres`). Restoring the branch affects `track` too, so prefer
copying the needed rows out of a restored child branch. Every published version of a post is also
kept as an immutable revision, so earlier text can be recovered from `aamirazad_post_revisions`
without a restore.

Roll back an application regression by promoting an earlier deployment:

```sh
vercel ls aamirazad-com
vercel rollback <deployment-url>
```
