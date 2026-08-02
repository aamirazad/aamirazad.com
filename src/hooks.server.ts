import type { Handle } from "@sveltejs/kit";

import { legacyRedirectFor } from "$lib/legacy-redirects";
import { readSession } from "$lib/server/auth/sessions";
import { requireRuntimeEnv } from "$lib/server/env";

const STATE_CHANGING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const PRIVATE_PREFIXES = ["/admin", "/api", "/preview"];

function isPrivatePath(pathname: string): boolean {
  return PRIVATE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.owner = null;
  const destination = legacyRedirectFor(event.url.pathname);
  if (destination && (event.request.method === "GET" || event.request.method === "HEAD")) {
    return new Response(null, {
      status: 308,
      headers: { location: new URL(destination, event.url).href },
    });
  }

  const privatePath = isPrivatePath(event.url.pathname);
  const sessionRequired = privatePath || event.url.pathname === "/auth/logout";
  if (sessionRequired) {
    const env = requireRuntimeEnv(event.platform);
    event.locals.owner = await readSession(env, event.cookies, event.url);
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
  } else if (event.request.method === "GET" || event.request.method === "HEAD") {
    // The adapter's legacy Cache API layer must not retain dynamic HTML. The outer Worker
    // replaces this with the public policy used by Workers Cache after SvelteKit returns.
    response.headers.set("cache-control", "no-cache");
    response.headers.set("x-public-cache", "1");
  }

  return response;
};
