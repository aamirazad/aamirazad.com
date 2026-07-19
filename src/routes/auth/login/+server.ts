import * as oauth from "oauth4webapi";
import { redirect, type RequestHandler } from "@sveltejs/kit";

import { oidcCookieName, OIDC_TRANSACTION_SECONDS, safeReturnTo } from "$lib/server/auth/constants";
import { loadOidcContext } from "$lib/server/auth/oidc";
import { storeOidcTransaction } from "$lib/server/auth/transactions";
import { requireRuntimeEnv } from "$lib/server/env";
import { enforceRateLimit } from "$lib/server/rate-limit";

export const GET: RequestHandler = async ({ cookies, getClientAddress, platform, url }) => {
  const env = requireRuntimeEnv(platform);
  await enforceRateLimit(env, getClientAddress(), "oidc_login", 10, 10 * 60);

  const context = await loadOidcContext(env, url);
  const state = oauth.generateRandomState();
  const nonce = oauth.generateRandomNonce();
  const codeVerifier = oauth.generateRandomCodeVerifier();
  const codeChallenge = await oauth.calculatePKCECodeChallenge(codeVerifier);
  const returnTo = safeReturnTo(url.searchParams.get("returnTo"));

  await storeOidcTransaction(env, state, codeVerifier, nonce, returnTo);
  cookies.set(oidcCookieName(url), state, {
    path: "/",
    httpOnly: true,
    secure: url.protocol === "https:",
    sameSite: "lax",
    maxAge: OIDC_TRANSACTION_SECONDS,
  });

  const authorizationUrl = new URL(context.server.authorization_endpoint!);
  authorizationUrl.searchParams.set("client_id", context.client.client_id);
  authorizationUrl.searchParams.set("redirect_uri", context.redirectUri);
  authorizationUrl.searchParams.set("response_type", "code");
  authorizationUrl.searchParams.set("scope", "openid profile email groups");
  authorizationUrl.searchParams.set("state", state);
  authorizationUrl.searchParams.set("nonce", nonce);
  authorizationUrl.searchParams.set("code_challenge", codeChallenge);
  authorizationUrl.searchParams.set("code_challenge_method", "S256");

  redirect(303, authorizationUrl.href);
};
