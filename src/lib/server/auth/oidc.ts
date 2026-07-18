import * as oauth from "oauth4webapi";

import { hmacHex, timingSafeStringEqual } from "$lib/server/crypto";
import type { RuntimeEnv } from "$lib/server/env";

export type OidcContext = {
  server: oauth.AuthorizationServer;
  client: oauth.Client;
  clientAuth: oauth.ClientAuth;
  issuer: URL;
  redirectUri: string;
};

export async function loadOidcContext(env: RuntimeEnv): Promise<OidcContext> {
  const configured = new URL(env.OIDC_DISCOVERY_URL);
  const issuer = discoveryIssuer(configured);
  const response = await oauth.discoveryRequest(issuer, { algorithm: "oidc" });
  const server = await oauth.processDiscoveryResponse(issuer, response);

  if (!server.authorization_endpoint || !server.token_endpoint) {
    throw new Error("Pocket ID discovery omitted a required endpoint");
  }

  const client: oauth.Client = { client_id: env.OIDC_CLIENT_ID };
  return {
    server,
    client,
    clientAuth: oauth.ClientSecretPost(env.OIDC_CLIENT_SECRET),
    issuer,
    redirectUri: `${env.APP_ORIGIN}/auth/callback`,
  };
}

export async function ownerClaimsAreAllowed(
  env: RuntimeEnv,
  issuer: string,
  subject: string,
  discoveredIssuer: string,
): Promise<boolean> {
  const issuerMatches = await timingSafeStringEqual(issuer, discoveredIssuer);
  const subjectMatches = await timingSafeStringEqual(subject, env.OIDC_OWNER_SUB);
  return issuerMatches && subjectMatches;
}

export async function stateHash(env: RuntimeEnv, state: string): Promise<string> {
  return hmacHex(env.SESSION_SECRET, state);
}

function discoveryIssuer(configured: URL): URL {
  const marker = "/.well-known/openid-configuration";
  if (configured.pathname.endsWith(marker)) {
    configured.pathname = configured.pathname.slice(0, -marker.length) || "/";
    configured.search = "";
    configured.hash = "";
  }
  return configured;
}
