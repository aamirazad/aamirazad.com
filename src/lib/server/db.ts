import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

export type Row = Record<string, unknown>;
export type QueryResult<T = Row> = { rows: T[]; rowCount: number };
export type Statement = { text: string; params: unknown[] };

/** A minimal driver: a single parameterised query, and a list of queries run in one transaction. */
export interface Driver {
  query(text: string, params: unknown[]): Promise<QueryResult>;
  transaction(statements: Statement[]): Promise<QueryResult[]>;
}

/** Build a statement for {@link Database.batch}. Placeholders are Postgres-style `$1`, `$2`, ... */
export function statement(text: string, ...params: unknown[]): Statement {
  return { text, params };
}

export class Database {
  constructor(private readonly driver: Driver) {}

  async all<T = Row>(text: string, ...params: unknown[]): Promise<T[]> {
    return (await this.driver.query(text, params)).rows as T[];
  }

  async first<T = Row>(text: string, ...params: unknown[]): Promise<T | null> {
    return ((await this.driver.query(text, params)).rows[0] as T | undefined) ?? null;
  }

  /** Execute a statement and return the number of affected rows. */
  async run(text: string, ...params: unknown[]): Promise<number> {
    return (await this.driver.query(text, params)).rowCount;
  }

  /** Run every statement atomically: either all of them commit or none do. */
  async batch(statements: Statement[]): Promise<QueryResult[]> {
    return this.driver.transaction(statements);
  }
}

/** Neon's HTTP driver: one round trip per query, no connection to manage between invocations. */
export function neonDriver(connectionString: string): Driver {
  const sql: NeonQueryFunction<false, true> = neon(connectionString, { fullResults: true });
  return {
    async query(text, params) {
      const result = await sql.query(text, params);
      return { rows: result.rows as Row[], rowCount: result.rowCount ?? 0 };
    },
    async transaction(statements) {
      if (statements.length === 0) return [];
      const results = await sql.transaction(
        statements.map((item) => sql.query(item.text, item.params)),
      );
      return results.map((result) => ({
        rows: result.rows as Row[],
        rowCount: result.rowCount ?? 0,
      }));
    },
  };
}
