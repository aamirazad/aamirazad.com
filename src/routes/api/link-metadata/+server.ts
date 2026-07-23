import { error } from "@sveltejs/kit";

import { fetchLinkMetadata } from "$lib/server/content/link-metadata";

import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request }) => {
  const data: unknown = await request.json();
  const url = data && typeof data === "object" ? (data as Record<string, unknown>).url : null;
  if (typeof url !== "string" || url.length > 2_048) error(400, "Enter a valid URL.");
  try {
    return Response.json(await fetchLinkMetadata(url));
  } catch (caught) {
    return Response.json(
      { error: caught instanceof Error ? caught.message : "Link preview failed." },
      { status: 422 },
    );
  }
};
