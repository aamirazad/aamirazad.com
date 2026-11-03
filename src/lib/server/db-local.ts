import { PGlite } from "@electric-sql/pglite";

import type { Driver, Row } from "./db";

const MIGRATIONS = import.meta.glob<string>("/migrations/*.sql", {
  query: "?raw",
  import: "default",
  eager: true,
});

/**
 * An embedded Postgres for local development and tests, so neither ever touches the shared Neon
 * database. Pass a directory to persist data between runs, or omit it for an in-memory database.
 */
export async function pgliteDriver(dataDir?: string): Promise<Driver> {
  const db = new PGlite(dataDir);
  await applyMigrations(db);
  return {
    async query(text, params) {
      const result = await db.query<Row>(text, params);
      return { rows: result.rows, rowCount: result.affectedRows ?? result.rows.length };
    },
    async transaction(statements) {
      return db.transaction(async (tx) => {
        const results = [];
        for (const item of statements) {
          const result = await tx.query<Row>(item.text, item.params);
          results.push({ rows: result.rows, rowCount: result.affectedRows ?? result.rows.length });
        }
        return results;
      });
    },
  };
}

async function applyMigrations(db: PGlite): Promise<void> {
  await db.exec(`CREATE TABLE IF NOT EXISTS aamirazad_schema_migrations (
    name TEXT PRIMARY KEY,
    applied_at TEXT NOT NULL
  )`);
  const applied = new Set(
    (await db.query<{ name: string }>("SELECT name FROM aamirazad_schema_migrations")).rows.map(
      (row) => row.name,
    ),
  );
  for (const [path, sql] of Object.entries(MIGRATIONS).sort(([a], [b]) => a.localeCompare(b))) {
    const name = path.split("/").at(-1)!;
    if (applied.has(name)) continue;
    await db.transaction(async (tx) => {
      await tx.exec(sql);
      await tx.query("INSERT INTO aamirazad_schema_migrations (name, applied_at) VALUES ($1, $2)", [
        name,
        new Date().toISOString(),
      ]);
    });
  }
}
