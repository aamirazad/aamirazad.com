import type { SiteItem, SiteItemInput, SiteItemKind } from "$lib/site-content";
import { auditEvent } from "$lib/server/audit";
import { uuidV7 } from "$lib/server/crypto";
import { statement } from "$lib/server/db";
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
  is_wip, position, version, created_at, updated_at FROM aamirazad_site_items`;

export async function listSiteItems(env: RuntimeEnv): Promise<SiteItem[]> {
  const rows = await env.DB.all<SiteItemRow>(
    `${SITE_ITEM_SELECT} WHERE deleted_at IS NULL
    ORDER BY CASE kind WHEN 'project' THEN 0 WHEN 'link' THEN 1 ELSE 2 END,
    position, created_at, id`,
  );
  return rows.map(mapSiteItem);
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
      await env.DB.first<{ position: number }>(
        `SELECT COALESCE(MAX(position), -1) + 1 AS position FROM aamirazad_site_items
        WHERE kind = $1 AND deleted_at IS NULL`,
        input.kind,
      )
    )?.position ?? 0;
  await env.DB.batch([
    statement(
      `INSERT INTO aamirazad_site_items (id, kind, name, description, href, github, code_url,
      badge, is_wip, position, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $11)`,
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
    ),
    auditEvent(actor, "site_item.created", id, now),
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
  const changes = await env.DB.run(
    `UPDATE aamirazad_site_items SET kind = $1, name = $2, description = $3, href = $4,
    github = $5, code_url = $6, badge = $7, is_wip = $8, version = version + 1, updated_at = $9
    WHERE id = $10 AND version = $11 AND deleted_at IS NULL`,
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
  );
  if (changes === 0) {
    return (await getSiteItem(env, id)) ? "conflict" : null;
  }
  await env.DB.batch([auditEvent(actor, "site_item.updated", id, now)]);
  return getSiteItem(env, id);
}

export async function deleteSiteItem(env: RuntimeEnv, id: string, actor: string): Promise<boolean> {
  const now = new Date().toISOString();
  const changes = await env.DB.run(
    `UPDATE aamirazad_site_items SET deleted_at = $1, updated_at = $1, version = version + 1
    WHERE id = $2 AND deleted_at IS NULL`,
    now,
    id,
  );
  if (changes === 0) return false;
  await env.DB.batch([auditEvent(actor, "site_item.deleted", id, now)]);
  return true;
}

async function getSiteItem(env: RuntimeEnv, id: string): Promise<SiteItem | null> {
  const row = await env.DB.first<SiteItemRow>(
    `${SITE_ITEM_SELECT} WHERE id = $1 AND deleted_at IS NULL LIMIT 1`,
    id,
  );
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
