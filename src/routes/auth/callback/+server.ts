import * as oauth from "oauth4webapi";
import { error, redirect, type RequestHandler } from "@sveltejs/kit";

import { oidcCookieName } from "$lib/server/auth/constants";
import { loadOidcContext, ownerClaimsAreAllowed } from "$lib/server/auth/oidc";
import { createSession, setSessionCookie } from "$lib/server/auth/sessions";
import { consumeOidcTransaction } from "$lib/server/auth/transactions";
import { timingSafeStringEqual, uuidV7 } from "$lib/server/crypto";
import { requireRuntimeEnv } from "$lib/server/env";
import { enforceRateLimit } from "$lib/server/rate-limit";

export const GET: RequestHandler = async ({ cookies, getClientAddress, platform, url }) => {
  const env = requireRuntimeEnv(platform);
  await enforceRateLimit(env, getClientAddress(), "oidc_callback", 20, 10 * 60);

  const returnedState = url.searchParams.get("state");
  const cookieState = cookies.get(oidcCookieName(url));
  cookies.delete(oidcCookieName(url), { path: "/" });
  if (
    !returnedState ||
    !cookieState ||
    !(await timingSafeStringEqual(returnedState, cookieState))
  ) {
    error(400, "The login response could not be verified");
  }

  const transaction = await consumeOidcTransaction(env, returnedState);
  if (!transaction) error(400, "The login request expired or was already used");

  try {
    const context = await loadOidcContext(env);
    const parameters = oauth.validateAuthResponse(
      context.server,
      context.client,
      url,
      returnedState,
    );
    const tokenResponse = await oauth.authorizationCodeGrantRequest(
      context.server,
      context.client,
      context.clientAuth,
      parameters,
      context.redirectUri,
      transaction.codeVerifier,
    );
    const tokens = await oauth.processAuthorizationCodeResponse(
      context.server,
      context.client,
      tokenResponse,
      { expectedNonce: transaction.nonce, requireIdToken: true },
    );
    const claims = oauth.getValidatedIdTokenClaims(tokens);
    if (!claims) error(403, "Pocket ID did not return verifiable identity claims");

    const issuer = String(claims.iss);
    const subject = claims.sub;
    const discoveredIssuer = String(context.server.issuer);
    await env.DB.prepare(
      `INSERT INTO audit_events (
        id, actor_subject, event_type, metadata_json, created_at
      ) VALUES (?, ?, 'auth.identity_received', ?, ?)`,
    )
      .bind(uuidV7(), subject, JSON.stringify({ issuer }), new Date().toISOString())
      .run();

    if (!env.OIDC_OWNER_SUB) {
      console.error(
        JSON.stringify({ message: "oidc owner subject is not configured", issuer, subject }),
      );
      error(503, "The publishing owner identity has not been configured yet");
    }

    if (!(await ownerClaimsAreAllowed(env, issuer, subject, discoveredIssuer))) {
      console.error(JSON.stringify({ message: "oidc authorization denied", issuer, subject }));
      error(403, "This identity is not authorized to publish");
    }

    const { token } = await createSession(env, issuer, subject);
    setSessionCookie(cookies, url, token);
    console.log(JSON.stringify({ message: "oidc authentication succeeded", issuer, subject }));
    redirect(303, transaction.returnTo);
  } catch (cause) {
    if (cause && typeof cause === "object" && "status" in cause) throw cause;
    console.error(
      JSON.stringify({
        message: "oidc callback failed",
        error: cause instanceof Error ? cause.message : String(cause),
      }),
    );
    error(502, "Pocket ID login could not be completed");
  }
};
