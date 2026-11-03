# aamirazad.com

The source for [aamirazad.com](https://aamirazad.com): a SvelteKit publishing application deployed to Vercel, with Neon Postgres for content and a private Vercel Blob store for media.

The previous Astro implementation is retained locally in `old-site/` only as a style and content reference. It is not part of the workspace or production build.

## Requirements

- Node.js 24 or newer
- pnpm 11.17.0 (the `packageManager` field is authoritative)
- The Vercel CLI, linked to the `aamirazad-com` project, for environment or deployment commands

## Development

```sh
pnpm install --frozen-lockfile
cp .env.example .env
pnpm dev
```

`pnpm dev` runs against an embedded PGlite Postgres in `.pglite/` (migrated automatically on
startup) and an in-memory media store, so local work never touches the shared production
database. Set `DEV_AUTH_BYPASS=true` in the ignored `.env` to use the admin without OIDC: every
`localhost` request is treated as the owner. The flag is ignored on every Vercel deployment.

## Quality checks

```sh
pnpm format:check
pnpm check
pnpm test
pnpm build
```

Tests run the server code against an in-memory PGlite database with the real migrations.

## Deployment

Vercel's Git integration owns deployment. Every push to `main` builds and deploys to production
(`aamirazad.com` and `www.aamirazad.com`); every other branch and pull request gets a preview
deployment. Production builds apply pending database migrations before building.

See `build-docs/operations.md` for the database layout, migrations, caching, secrets, recovery, and rollback.
