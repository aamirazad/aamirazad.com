import { hmacHex } from "$lib/server/crypto";
import { statement } from "$lib/server/db";
import type { RuntimeEnv } from "$lib/server/env";

import { OIDC_TRANSACTION_SECONDS } from "./constants";

export type OidcTransaction = {
  stateHash: string;
  codeVerifier: string;
  nonce: string;
  returnTo: string;
  expiresAt: string;
};

type TransactionRow = {
  state_hash: string;
  code_verifier: string;
  nonce: string;
  return_to: string;
  expires_at: string;
  consumed_at: string | null;
};

export async function storeOidcTransaction(
  env: RuntimeEnv,
  state: string,
  codeVerifier: string,
  nonce: string,
  returnTo: string,
  now = new Date(),
): Promise<void> {
  const stateHash = await hmacHex(env.SESSION_SECRET, state);
  await env.DB.batch([
    statement("DELETE FROM aamirazad_oidc_transactions WHERE expires_at <= $1", now.toISOString()),
    statement(
      `INSERT INTO aamirazad_oidc_transactions (
        state_hash, code_verifier, nonce, return_to, created_at, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6)`,
      stateHash,
      codeVerifier,
      nonce,
      returnTo,
      now.toISOString(),
      new Date(now.getTime() + OIDC_TRANSACTION_SECONDS * 1000).toISOString(),
    ),
  ]);
}

export async function consumeOidcTransaction(
  env: RuntimeEnv,
  state: string,
  now = new Date(),
): Promise<OidcTransaction | null> {
  const stateHash = await hmacHex(env.SESSION_SECRET, state);
  const row = await env.DB.first<TransactionRow>(
    `SELECT state_hash, code_verifier, nonce, return_to, expires_at, consumed_at
    FROM aamirazad_oidc_transactions WHERE state_hash = $1 LIMIT 1`,
    stateHash,
  );

  if (!row || row.consumed_at !== null || row.expires_at <= now.toISOString()) return null;

  const changes = await env.DB.run(
    `UPDATE aamirazad_oidc_transactions SET consumed_at = $1
    WHERE state_hash = $2 AND consumed_at IS NULL`,
    now.toISOString(),
    stateHash,
  );
  if (changes !== 1) return null;

  return {
    stateHash: row.state_hash,
    codeVerifier: row.code_verifier,
    nonce: row.nonce,
    returnTo: row.return_to,
    expiresAt: row.expires_at,
  };
}
