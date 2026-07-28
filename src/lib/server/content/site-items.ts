import type { SiteItem, SiteItemInput, SiteItemKind } from "$lib/site-content";
import { uuidV7 } from "$lib/server/crypto";
import type { RuntimeEnv } from "$lib/server/env";

type SiteItemRow = {
  id: string;
  kind: SiteItemKind;
  name: string;
  description: string;
  href: string | null;
  github: string | null;
  code_url: string | null;
  badge: string | null;
  is_wip: number;
  position: number;
  version: number;
  created_at: string;
  updated_at: string;
};

const SITE_ITEM_SELECT = `SELECT id, kind, name, description, href, github, code_url, badge,
  is_wip, position, version, created_at, updated_at FROM site_items`;

export async function listSiteItems(env: RuntimeEnv): Promise<SiteItem[]> {
  const result = await env.DB.prepare(
    `${SITE_ITEM_SELECT} WHERE deleted_at IS NULL
    ORDER BY CASE kind WHEN 'project' THEN 0 WHEN 'link' THEN 1 ELSE 2 END,
    position, created_at, id`,
  ).all<SiteItemRow>();
  return result.results.map(mapSiteItem);
}

export async function createSiteItem(
  env: RuntimeEnv,
  input: SiteItemInput,
  actor: string,
): Promise<SiteItem> {
  const id = uuidV7();
  const now = new Date().toISOString();
  const position =
    (
      await env.DB.prepare(
        "SELECT COALESCE(MAX(position), -1) + 1 AS position FROM site_items WHERE kind = ? AND deleted_at IS NULL",
      )
        .bind(input.kind)
        .first<{ position: number }>()
    )?.position ?? 0;
  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO site_items (id, kind, name, description, href, github, code_url, badge,
      is_wip, position, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(
      id,
      input.kind,
      input.name,
      input.description,
      nullable(input.href),
      nullable(input.github),
      nullable(input.codeUrl),
      nullable(input.badge),
      input.isWip ? 1 : 0,
      position,
      now,
      now,
    ),
    env.DB.prepare(
      `INSERT INTO audit_events (id, actor_subject, event_type, target_id, created_at)
      VALUES (?, ?, 'site_item.created', ?, ?)`,
    ).bind(uuidV7(), actor, id, now),
  ]);
  const item = await getSiteItem(env, id);
  if (!item) throw new Error("Content creation did not return an item");
  return item;
}

export async function updateSiteItem(
  env: RuntimeEnv,
  id: string,
  input: SiteItemInput & { version: number },
  actor: string,
): Promise<SiteItem | "conflict" | null> {
  const now = new Date().toISOString();
  const result = await env.DB.prepare(
    `UPDATE site_items SET kind = ?, name = ?, description = ?, href = ?, github = ?,
    code_url = ?, badge = ?, is_wip = ?, version = version + 1, updated_at = ?
    WHERE id = ? AND version = ? AND deleted_at IS NULL`,
  )
    .bind(
      input.kind,
      input.name,
      input.description,
      nullable(input.href),
      nullable(input.github),
      nullable(input.codeUrl),
      nullable(input.badge),
      input.isWip ? 1 : 0,
      now,
      id,
      input.version,
    )
    .run();
  if ((result.meta.changes ?? 0) === 0) {
    return (await getSiteItem(env, id)) ? "conflict" : null;
  }
  await env.DB.prepare(
    `INSERT INTO audit_events (id, actor_subject, event_type, target_id, created_at)
    VALUES (?, ?, 'site_item.updated', ?, ?)`,
  )
    .bind(uuidV7(), actor, id, now)
    .run();
  return getSiteItem(env, id);
}

export async function deleteSiteItem(env: RuntimeEnv, id: string, actor: string): Promise<boolean> {
  const now = new Date().toISOString();
  const result = await env.DB.prepare(
    `UPDATE site_items SET deleted_at = ?, updated_at = ?, version = version + 1
    WHERE id = ? AND deleted_at IS NULL`,
  )
    .bind(now, now, id)
    .run();
  if ((result.meta.changes ?? 0) === 0) return false;
  await env.DB.prepare(
    `INSERT INTO audit_events (id, actor_subject, event_type, target_id, created_at)
    VALUES (?, ?, 'site_item.deleted', ?, ?)`,
  )
    .bind(uuidV7(), actor, id, now)
    .run();
  return true;
}

async function getSiteItem(env: RuntimeEnv, id: string): Promise<SiteItem | null> {
  const row = await env.DB.prepare(
    `${SITE_ITEM_SELECT} WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
  )
    .bind(id)
    .first<SiteItemRow>();
  return row ? mapSiteItem(row) : null;
}

function mapSiteItem(row: SiteItemRow): SiteItem {
  return {
    id: row.id,
    kind: row.kind,
    name: row.name,
    description: row.description,
    href: row.href ?? "",
    github: row.github ?? "",
    codeUrl: row.code_url ?? "",
    badge: row.badge ?? "",
    isWip: row.is_wip === 1,
    position: row.position,
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function nullable(value: string): string | null {
  return value.trim() ? value.trim() : null;
}
