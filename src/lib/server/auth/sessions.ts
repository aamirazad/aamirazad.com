import type { Cookies } from "@sveltejs/kit";

import { hmacHex, randomToken } from "$lib/server/crypto";
import type { RuntimeEnv } from "$lib/server/env";

import { SESSION_ABSOLUTE_SECONDS, SESSION_IDLE_SECONDS, sessionCookieName } from "./constants";

export type OwnerSession = {
  issuer: string;
  subject: string;
  absoluteExpiresAt: string;
};

type SessionRow = {
  oidc_issuer: string;
  oidc_subject: string;
  last_seen_at: string;
  idle_expires_at: string;
  absolute_expires_at: string;
  revoked_at: string | null;
};

export async function createSession(
  env: RuntimeEnv,
  issuer: string,
  subject: string,
  now = new Date(),
): Promise<{ token: string; session: OwnerSession }> {
  const token = randomToken();
  const tokenHash = await hmacHex(env.SESSION_SECRET, token);
  const createdAt = now.toISOString();
  const idleExpiresAt = new Date(now.getTime() + SESSION_IDLE_SECONDS * 1000).toISOString();
  const absoluteExpiresAt = new Date(now.getTime() + SESSION_ABSOLUTE_SECONDS * 1000).toISOString();

  await env.DB.prepare(
    `INSERT INTO sessions (
      token_hash, oidc_issuer, oidc_subject, created_at, last_seen_at,
      idle_expires_at, absolute_expires_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(tokenHash, issuer, subject, createdAt, createdAt, idleExpiresAt, absoluteExpiresAt)
    .run();

  return {
    token,
    session: { issuer, subject, absoluteExpiresAt },
  };
}

export async function readSession(
  env: RuntimeEnv,
  cookies: Cookies,
  origin: URL,
  now = new Date(),
): Promise<OwnerSession | null> {
  const token = cookies.get(sessionCookieName(origin));
  if (!token) return null;

  const tokenHash = await hmacHex(env.SESSION_SECRET, token);
  const row = await env.DB.prepare(
    `SELECT oidc_issuer, oidc_subject, last_seen_at, idle_expires_at,
      absolute_expires_at, revoked_at
    FROM sessions WHERE token_hash = ? LIMIT 1`,
  )
    .bind(tokenHash)
    .first<SessionRow>();

  const nowIso = now.toISOString();
  if (
    !row ||
    row.revoked_at !== null ||
    row.idle_expires_at <= nowIso ||
    row.absolute_expires_at <= nowIso
  ) {
    deleteSessionCookie(cookies, origin);
    return null;
  }

  const refreshAfter = new Date(row.last_seen_at).getTime() + 5 * 60 * 1000;
  if (now.getTime() >= refreshAfter) {
    const nextIdleExpiry = new Date(
      Math.min(
        now.getTime() + SESSION_IDLE_SECONDS * 1000,
        new Date(row.absolute_expires_at).getTime(),
      ),
    ).toISOString();
    await env.DB.prepare(
      "UPDATE sessions SET last_seen_at = ?, idle_expires_at = ? WHERE token_hash = ?",
    )
      .bind(nowIso, nextIdleExpiry, tokenHash)
      .run();
  }

  return {
    issuer: row.oidc_issuer,
    subject: row.oidc_subject,
    absoluteExpiresAt: row.absolute_expires_at,
  };
}

export async function revokeSession(env: RuntimeEnv, cookies: Cookies, origin: URL): Promise<void> {
  const token = cookies.get(sessionCookieName(origin));
  if (token) {
    const tokenHash = await hmacHex(env.SESSION_SECRET, token);
    await env.DB.prepare("UPDATE sessions SET revoked_at = ? WHERE token_hash = ?")
      .bind(new Date().toISOString(), tokenHash)
      .run();
  }
  deleteSessionCookie(cookies, origin);
}

export function setSessionCookie(cookies: Cookies, origin: URL, token: string): void {
  cookies.set(sessionCookieName(origin), token, {
    path: "/",
    httpOnly: true,
    secure: origin.protocol === "https:",
    sameSite: "lax",
    maxAge: SESSION_ABSOLUTE_SECONDS,
  });
}

function deleteSessionCookie(cookies: Cookies, origin: URL): void {
  cookies.delete(sessionCookieName(origin), { path: "/" });
}
