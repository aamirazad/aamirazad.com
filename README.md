# aamirazad.com

The source for [aamirazad.com](https://aamirazad.com): a SvelteKit publishing application deployed to Cloudflare Workers with Static Assets, D1, R2, and Workflows.

The previous Astro implementation is retained locally in `old-site/` only as a style and content reference. It is not part of the workspace or production build.

## Requirements

- Node.js 24 or newer
- pnpm 11.1.2 (the `packageManager` field is authoritative)
- A Wrangler-authenticated Cloudflare account for resource or deployment commands

## Development

```sh
pnpm install --frozen-lockfile
cp .env.example .env
pnpm dev
```

The ignored `.env` contains only local Pocket ID configuration. Cloudflare storage is accessed through bindings, not credentials in `.env`.

## Quality checks

```sh
pnpm format:check
pnpm check
pnpm test
pnpm build
pnpm exec wrangler deploy --dry-run --env preview
```

## Deployment

```sh
pnpm deploy:preview
pnpm deploy:production
```

See `build-docs/operations.md` for provisioning, migrations, secrets, backups, restore, and rollback procedures.
