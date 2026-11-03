// Apply pending migrations in `migrations/` to the Neon database in DATABASE_URL_UNPOOLED (or
// DATABASE_URL). Each migration runs in its own transaction and is recorded in
// `aamirazad_schema_migrations`, the same bookkeeping table local PGlite databases use.
//
//   node scripts/migrate.mjs                  apply pending migrations
//   node scripts/migrate.mjs --list           show applied and pending migrations only
//   node scripts/migrate.mjs --if-production  apply only during a Vercel production build
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

import { Pool } from "@neondatabase/serverless";

const args = new Set(process.argv.slice(2));

if (args.has("--if-production") && process.env.VERCEL_ENV !== "production") {
  console.log("Skipping database migrations outside a Vercel production build.");
  process.exit(0);
}

const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL_UNPOOLED or DATABASE_URL must be set to run migrations.");
  process.exit(1);
}

const directory = new URL("../migrations/", import.meta.url).pathname;
const files = (await readdir(directory)).filter((name) => name.endsWith(".sql")).sort();
const pool = new Pool({ connectionString });
const client = await pool.connect();

try {
  await client.query(`CREATE TABLE IF NOT EXISTS aamirazad_schema_migrations (
    name TEXT PRIMARY KEY,
    applied_at TEXT NOT NULL
  )`);
  // Serialise concurrent builds; the lock is released when the session ends.
  await client.query("SELECT pg_advisory_lock(hashtext('aamirazad_schema_migrations'))");
  const { rows } = await client.query("SELECT name FROM aamirazad_schema_migrations");
  const applied = new Set(rows.map((row) => row.name));
  const pending = files.filter((name) => !applied.has(name));

  if (args.has("--list")) {
    for (const name of files) console.log(`${applied.has(name) ? "applied" : "pending"}  ${name}`);
  } else if (pending.length === 0) {
    console.log("Database schema is up to date.");
  } else {
    for (const name of pending) {
      const sql = await readFile(join(directory, name), "utf8");
      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query(
          "INSERT INTO aamirazad_schema_migrations (name, applied_at) VALUES ($1, $2)",
          [name, new Date().toISOString()],
        );
        await client.query("COMMIT");
        console.log(`Applied ${name}`);
      } catch (cause) {
        await client.query("ROLLBACK");
        throw new Error(`Migration ${name} failed: ${cause.message}`, { cause });
      }
    }
  }
} finally {
  client.release();
  await pool.end();
}
