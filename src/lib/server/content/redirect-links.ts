import type { RedirectLink, RedirectLinkInput } from "$lib/redirect-links";
import { uuidV7 } from "$lib/server/crypto";
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
  r.created_at, r.updated_at, COUNT(c.id) AS all_time_clicks,
  COALESCE(SUM(CASE WHEN c.clicked_at >= ? THEN 1 ELSE 0 END), 0) AS last_24_hours_clicks
  FROM redirect_links r LEFT JOIN redirect_link_clicks c ON c.redirect_link_id = r.id`;

export async function listRedirectLinks(env: RuntimeEnv): Promise<RedirectLink[]> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1_000).toISOString();
  const result = await env.DB.prepare(
    `${SELECT_REDIRECTS} WHERE r.deleted_at IS NULL GROUP BY r.id ORDER BY r.created_at DESC, r.id`,
  )
    .bind(since)
    .all<RedirectLinkRow>();
  return result.results.map(mapRedirectLink);
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
    env.DB.prepare(
      `INSERT INTO redirect_links (id, path, target_url, label, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).bind(id, input.path, input.targetUrl, input.label, now, now),
    env.DB.prepare(
      `INSERT INTO audit_events (id, actor_subject, event_type, target_id, created_at)
       VALUES (?, ?, 'redirect_link.created', ?, ?)`,
    ).bind(uuidV7(), actor, id, now),
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
  const result = await env.DB.prepare(
    `UPDATE redirect_links SET path = ?, target_url = ?, label = ?, version = version + 1,
     updated_at = ? WHERE id = ? AND version = ? AND deleted_at IS NULL`,
  )
    .bind(input.path, input.targetUrl, input.label, now, id, input.version)
    .run();
  if ((result.meta.changes ?? 0) === 0) return (await getRedirectLink(env, id)) ? "conflict" : null;
  await env.DB.prepare(
    `INSERT INTO audit_events (id, actor_subject, event_type, target_id, created_at)
     VALUES (?, ?, 'redirect_link.updated', ?, ?)`,
  )
    .bind(uuidV7(), actor, id, now)
    .run();
  return getRedirectLink(env, id);
}

export async function deleteRedirectLink(
  env: RuntimeEnv,
  id: string,
  actor: string,
): Promise<boolean> {
  const now = new Date().toISOString();
  const result = await env.DB.prepare(
    `UPDATE redirect_links SET deleted_at = ?, updated_at = ?, version = version + 1
     WHERE id = ? AND deleted_at IS NULL`,
  )
    .bind(now, now, id)
    .run();
  if ((result.meta.changes ?? 0) === 0) return false;
  await env.DB.prepare(
    `INSERT INTO audit_events (id, actor_subject, event_type, target_id, created_at)
     VALUES (?, ?, 'redirect_link.deleted', ?, ?)`,
  )
    .bind(uuidV7(), actor, id, now)
    .run();
  return true;
}

export async function resolveRedirectLink(
  env: RuntimeEnv,
  path: string,
  trackClick = true,
): Promise<string | null> {
  const link = await env.DB.prepare(
    "SELECT id, target_url FROM redirect_links WHERE path = ? AND deleted_at IS NULL LIMIT 1",
  )
    .bind(path)
    .first<{ id: string; target_url: string }>();
  if (!link) return null;
  if (trackClick) {
    await env.DB.prepare(
      "INSERT INTO redirect_link_clicks (id, redirect_link_id, clicked_at) VALUES (?, ?, ?)",
    )
      .bind(uuidV7(), link.id, new Date().toISOString())
      .run();
  }
  return link.target_url;
}

async function findLiveRedirectByPath(env: RuntimeEnv, path: string) {
  return env.DB.prepare(
    "SELECT id FROM redirect_links WHERE path = ? AND deleted_at IS NULL LIMIT 1",
  )
    .bind(path)
    .first<{ id: string }>();
}

async function getRedirectLink(env: RuntimeEnv, id: string): Promise<RedirectLink | null> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1_000).toISOString();
  const row = await env.DB.prepare(
    `${SELECT_REDIRECTS} WHERE r.id = ? AND r.deleted_at IS NULL GROUP BY r.id LIMIT 1`,
  )
    .bind(since, id)
    .first<RedirectLinkRow>();
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
