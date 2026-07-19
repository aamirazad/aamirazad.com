# Publishing Operations

## Portable content export

The owner can create a provider-independent recovery archive from the **Portable recovery** panel at `/admin`. The request is authenticated, produces a streamed uncompressed TAR download, sets `private, no-store`, and records only a `portable_export.created` audit event with post and asset counts.

The version 1 archive contains:

- `posts/<post-id>/working.md` for every non-deleted working copy.
- `posts/<post-id>/revisions/<revision-id>.md` for every immutable revision.
- JSON-in-YAML front matter with stable IDs, series, format, paths, aliases, source fields, timestamps, and revision hashes.
- Original media and publication-time image variants.
- Post-to-asset relationships, captions, alt text, dimensions, MIME types, and checksums.
- The current R2 public projection, including published revision snapshots, indexes, feeds, sitemap, and projection manifest.

It intentionally excludes Worker secrets, OIDC transactions, sessions, rate limits, publish jobs, audit history, and other operational records. Export creation is an owner action, not a scheduled backup system.

## Verify and rebuild an export

Use a new destination directory; the recovery command refuses to overwrite an existing tree:

```sh
pnpm rebuild:export -- ~/Downloads/aamirazad-content-YYYY-MM-DD.tar /tmp/aamirazad-recovery
```

The command parses and validates the TAR, checks its schema and object sizes, verifies every original media SHA-256 digest, and produces:

- `source/` — Markdown and portable metadata for migration to any publishing system.
- `content/` — files arranged by their exact `CONTENT` object keys.
- `media/` — originals and variants arranged by their exact `MEDIA` object keys.
- `restore-manifest.json` — the versioned mapping between archive files and storage keys.

The restored `content/` and `media/` trees can populate fresh object-storage buckets. Deploying this repository against those buckets restores the public read path without D1 or Pocket ID; public routes read `published/current.json` and the referenced immutable projection objects directly.

The Worker integration test performs this drill in isolation: it publishes a post with media, exports the archive, deletes all exported `CONTENT` and `MEDIA` objects, restores only those two bindings from the TAR, and then reads the published post again. Run it with:

```sh
pnpm test:worker
```

For a real incident, retain the archive unchanged, verify it into a new directory, restore into new buckets first, and point a preview Worker at those buckets before changing production bindings or routes.

## D1 migrations

Inspect pending migrations before applying them:

```sh
pnpm exec wrangler d1 migrations list personal-site-preview --remote --env preview
pnpm exec wrangler d1 migrations list personal-site --remote --env production
```

Apply only to the intended environment:

```sh
pnpm exec wrangler d1 migrations apply personal-site-preview --remote --env preview
pnpm exec wrangler d1 migrations apply personal-site --remote --env production
```

Migration `0003_remove_backup_scaffolding.sql` removes the unused `backup_jobs` table. The unused `BACKUPS` bindings were removed at the same stopping point; portable export is assembled on demand and is not stored server-side.

## Worker deployment rollback

List production deployment history before choosing a target:

```sh
pnpm exec wrangler deployments list --env production
```

Roll back only to an inspected version, then repeat the production smoke checklist:

```sh
pnpm exec wrangler rollback <version-id> --env production
```

Production now uses Worker Custom Domains for the apex and `www`; the old Vercel DNS records are no longer an origin fallback. Use Wrangler deployment rollback for an application regression. The disaster-recovery procedure and retained Astro source reference are recorded in `build-docs/production-cutover.md`.
