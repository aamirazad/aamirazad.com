# aamirazad.com

The source for [aamirazad.com](https://aamirazad.com): a SvelteKit publishing application deployed to Cloudflare Workers with Static Assets, D1, and R2.

The previous Astro implementation is retained locally in `old-site/` only as a style and content reference. It is not part of the workspace or production build.

## Requirements

- Node.js 24 or newer
- pnpm 11.17.0 (the `packageManager` field is authoritative)
- A Wrangler-authenticated Cloudflare account for resource or deployment commands

## Development

```sh
pnpm install --frozen-lockfile
cp .env.example .env
pnpm dev
```

`pnpm dev` applies the D1 migrations to the local database (`.wrangler/state`) before starting
Vite, and D1, R2, and Images bindings are simulated locally. Set `DEV_AUTH_BYPASS=true` in the ignored
`.env` to use the admin without OIDC: every `localhost` request is treated as the owner. The flag
is ignored unless Wrangler is running the local environment, so preview and production always
require a real session.

`pnpm preview` builds the production bundle and serves it with `wrangler dev` on the same port.

## Quality checks

```sh
pnpm format:check
pnpm check
pnpm test
pnpm build
pnpm exec wrangler deploy --dry-run --env production
```

## Deployment

Cloudflare Workers Builds owns branch deployment. Configure `main` as the production branch with
`pnpm build` as the build command, `pnpm exec wrangler deploy --env production` as the production
deploy command, and `pnpm exec wrangler versions upload --env preview` as the non-production branch
deploy command. A pull request is uploaded as a preview version of the same Worker and receives a
temporary `workers.dev` URL; merging to `main` promotes a production version to the apex and `www`
custom domains.

The `prebuild` hook also makes this binding selection fail-safe when Workers Builds uses its default
deploy commands. Cloudflare supplies `WORKERS_CI_BRANCH`; the hook persists
`CLOUDFLARE_ENV=production` for `main` and `CLOUDFLARE_ENV=preview` for every other branch before
Wrangler runs. Local builds, which do not have `WORKERS_CI_BRANCH`, leave `.env` unchanged.

For an equivalent manual upload or deployment:

```sh
pnpm deploy:preview
pnpm deploy:production
```

See `build-docs/operations.md` for provisioning, migrations, secrets, backups, restore, and rollback procedures.
