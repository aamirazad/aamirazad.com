import type { Handle } from "@sveltejs/kit";

import { legacyRedirectFor } from "$lib/legacy-redirects";

export const handle: Handle = async ({ event, resolve }) => {
  const destination = legacyRedirectFor(event.url.pathname);
  if (destination && (event.request.method === "GET" || event.request.method === "HEAD")) {
    return new Response(null, {
      status: 308,
      headers: { location: new URL(destination, event.url).href },
    });
  }

  return resolve(event);
};
