import type { Handle } from "@sveltejs/kit";

import { cacheTagsForPath } from "$lib/published";
import { devBypassOwner } from "$lib/server/auth/dev-bypass";
import { publicCachePolicy } from "$lib/server/cache-policy";
import { readSession } from "$lib/server/auth/sessions";
import { resolveRedirectLink } from "$lib/server/content/redirect-links";
import { runtimeEnv } from "$lib/server/env";

const STATE_CHANGING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const PRIVATE_PREFIXES = ["/admin", "/api", "/preview"];

function isPrivatePath(pathname: string): boolean {
  return PRIVATE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.owner = null;
  const privatePath = isPrivatePath(event.url.pathname);
  const env = await runtimeEnv();

  // Sessions and OIDC state are bound to the apex, so private pages must not be used on www.
  if (
    event.url.hostname === "www.aamirazad.com" &&
    new URL(env.APP_ORIGIN).hostname === "aamirazad.com" &&
    (privatePath || event.url.pathname.startsWith("/auth/"))
  ) {
    return new Response(null, {
      status: 307,
      headers: {
        "cache-control": "private, no-store",
        location: new URL(`${event.url.pathname}${event.url.search}`, env.APP_ORIGIN).href,
      },
    });
  }

  if (
    !privatePath &&
    !event.url.pathname.startsWith("/auth/") &&
    (event.request.method === "GET" || event.request.method === "HEAD")
  ) {
    const target = await resolveRedirectLink(
      env,
      event.url.pathname,
      event.request.method === "GET",
    );
    if (target) {
      return new Response(null, {
        status: 302,
        headers: { location: new URL(target, event.url).href, "cache-control": "no-store" },
      });
    }
  }
  const sessionRequired = privatePath || event.url.pathname === "/auth/logout";
  if (sessionRequired) {
    event.locals.owner =
      devBypassOwner(env, event.url) ?? (await readSession(env, event.cookies, event.url));
    if (!event.locals.owner) {
      if (event.url.pathname.startsWith("/api/")) {
        return Response.json(
          { error: "Unauthorized" },
          { status: 401, headers: { "cache-control": "private, no-store" } },
        );
      }
      const login = new URL("/auth/login", event.url);
      login.searchParams.set("returnTo", `${event.url.pathname}${event.url.search}`);
      return new Response(null, {
        status: 303,
        headers: { location: login.href, "cache-control": "private, no-store" },
      });
    }
  }

  if (
    event.url.pathname === "/admin" &&
    (event.request.method === "GET" || event.request.method === "HEAD")
  ) {
    return new Response(null, {
      status: 307,
      headers: {
        "cache-control": "private, no-store",
        location: new URL("/admin/create", event.url).href,
      },
    });
  }

  if (STATE_CHANGING_METHODS.has(event.request.method)) {
    const origin = event.request.headers.get("origin");
    if (origin !== event.url.origin) {
      return Response.json(
        { error: "Invalid request origin" },
        { status: 403, headers: { "cache-control": "private, no-store" } },
      );
    }
  }

  const resolved = await resolve(event);
  const response = new Response(resolved.body, resolved);
  response.headers.set("cross-origin-opener-policy", "same-origin");
  response.headers.set("permissions-policy", "camera=(self), microphone=(), geolocation=()");
  response.headers.set("referrer-policy", "strict-origin-when-cross-origin");
  response.headers.set("x-content-type-options", "nosniff");
  response.headers.set("x-frame-options", "DENY");

  if (privatePath || event.url.pathname.startsWith("/auth/")) {
    response.headers.set("cache-control", "private, no-store");
  } else if (response.status >= 300 && response.status < 400 && response.status !== 304) {
    // Redirect destinations are editable and every GET is a tracked click.
    response.headers.set("cache-control", "no-store");
  } else if (
    (event.request.method === "GET" || event.request.method === "HEAD") &&
    (response.status < 300 || response.status === 304)
  ) {
    // Vercel's CDN follows `Vercel-CDN-Cache-Control`; browsers only see `Cache-Control`.
    // Publishing invalidates the cache tags, so edge copies can live longer than browser ones.
    const policy = publicCachePolicy(event.url.pathname);
    response.headers.set("cache-control", policy.browser);
    response.headers.set("vercel-cdn-cache-control", policy.edge);
    response.headers.set("vercel-cache-tag", cacheTagsForPath(event.url.pathname).join(","));
  } else {
    response.headers.set("cache-control", "no-store");
  }

  return response;
};
