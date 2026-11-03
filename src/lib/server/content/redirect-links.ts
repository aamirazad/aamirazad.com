import type { RedirectLink, RedirectLinkInput } from "$lib/redirect-links";
import { auditEvent } from "$lib/server/audit";
import { uuidV7 } from "$lib/server/crypto";
import { statement } from "$lib/server/db";
import type { RuntimeEnv } from "$lib/server/env";

type RedirectLinkRow = {
  id: string;
  path: string;
  target_url: string;
  label: string;
  version: number;
  created_at: string;
  updated_at: string;
  all_time_clicks: number;
  last_24_hours_clicks: number;
};

const SELECT_REDIRECTS = `SELECT r.id, r.path, r.target_url, r.label, r.version,
  r.created_at, r.updated_at, COUNT(c.id)::int AS all_time_clicks,
  COUNT(c.id) FILTER (WHERE c.clicked_at >= $1)::int AS last_24_hours_clicks
  FROM aamirazad_redirect_links r
  LEFT JOIN aamirazad_redirect_link_clicks c ON c.redirect_link_id = r.id`;

export async function listRedirectLinks(env: RuntimeEnv): Promise<RedirectLink[]> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1_000).toISOString();
  const rows = await env.DB.all<RedirectLinkRow>(
    `${SELECT_REDIRECTS} WHERE r.deleted_at IS NULL GROUP BY r.id ORDER BY r.created_at DESC, r.id`,
    since,
  );
  return rows.map(mapRedirectLink);
}

export async function createRedirectLink(
  env: RuntimeEnv,
  input: RedirectLinkInput,
  actor: string,
): Promise<RedirectLink | "path_taken"> {
  const duplicate = await findLiveRedirectByPath(env, input.path);
  if (duplicate) return "path_taken";
  const id = uuidV7();
  const now = new Date().toISOString();
  await env.DB.batch([
    statement(
      `INSERT INTO aamirazad_redirect_links (id, path, target_url, label, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $5)`,
      id,
      input.path,
      input.targetUrl,
      input.label,
      now,
    ),
    auditEvent(actor, "redirect_link.created", id, now),
  ]);
  const link = await getRedirectLink(env, id);
  if (!link) throw new Error("Redirect creation did not return a link");
  return link;
}

export async function updateRedirectLink(
  env: RuntimeEnv,
  id: string,
  input: RedirectLinkInput & { version: number },
  actor: string,
): Promise<RedirectLink | "conflict" | "path_taken" | null> {
  const duplicate = await findLiveRedirectByPath(env, input.path);
  if (duplicate && duplicate.id !== id) return "path_taken";
  const now = new Date().toISOString();
  const changes = await env.DB.run(
    `UPDATE aamirazad_redirect_links SET path = $1, target_url = $2, label = $3,
     version = version + 1, updated_at = $4
     WHERE id = $5 AND version = $6 AND deleted_at IS NULL`,
    input.path,
    input.targetUrl,
    input.label,
    now,
    id,
    input.version,
  );
  if (changes === 0) return (await getRedirectLink(env, id)) ? "conflict" : null;
  await env.DB.batch([auditEvent(actor, "redirect_link.updated", id, now)]);
  return getRedirectLink(env, id);
}

export async function deleteRedirectLink(
  env: RuntimeEnv,
  id: string,
  actor: string,
): Promise<boolean> {
  const now = new Date().toISOString();
  const changes = await env.DB.run(
    `UPDATE aamirazad_redirect_links SET deleted_at = $1, updated_at = $1, version = version + 1
     WHERE id = $2 AND deleted_at IS NULL`,
    now,
    id,
  );
  if (changes === 0) return false;
  await env.DB.batch([auditEvent(actor, "redirect_link.deleted", id, now)]);
  return true;
}

export async function resolveRedirectLink(
  env: RuntimeEnv,
  path: string,
  trackClick = true,
): Promise<string | null> {
  const link = await env.DB.first<{ id: string; target_url: string }>(
    `SELECT id, target_url FROM aamirazad_redirect_links
    WHERE path = $1 AND deleted_at IS NULL LIMIT 1`,
    path,
  );
  if (!link) return null;
  if (trackClick) {
    await env.DB.run(
      `INSERT INTO aamirazad_redirect_link_clicks (id, redirect_link_id, clicked_at)
      VALUES ($1, $2, $3)`,
      uuidV7(),
      link.id,
      new Date().toISOString(),
    );
  }
  return link.target_url;
}

async function findLiveRedirectByPath(env: RuntimeEnv, path: string) {
  return env.DB.first<{ id: string }>(
    "SELECT id FROM aamirazad_redirect_links WHERE path = $1 AND deleted_at IS NULL LIMIT 1",
    path,
  );
}

async function getRedirectLink(env: RuntimeEnv, id: string): Promise<RedirectLink | null> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1_000).toISOString();
  const row = await env.DB.first<RedirectLinkRow>(
    `${SELECT_REDIRECTS} WHERE r.id = $2 AND r.deleted_at IS NULL GROUP BY r.id LIMIT 1`,
    since,
    id,
  );
  return row ? mapRedirectLink(row) : null;
}

function mapRedirectLink(row: RedirectLinkRow): RedirectLink {
  return {
    id: row.id,
    path: row.path,
    targetUrl: row.target_url,
    label: row.label,
    allTimeClicks: Number(row.all_time_clicks),
    last24HoursClicks: Number(row.last_24_hours_clicks),
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
