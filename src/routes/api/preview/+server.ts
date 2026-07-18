import { error } from "@sveltejs/kit";

import { renderMarkdown } from "$lib/server/content/markdown";

import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request }) => {
  const data: unknown = await request.json();
  if (
    !data ||
    typeof data !== "object" ||
    typeof (data as Record<string, unknown>).markdown !== "string"
  ) {
    error(400, "Invalid Markdown");
  }
  const markdown = String((data as Record<string, unknown>).markdown).slice(0, 250_000);
  return Response.json({ html: await renderMarkdown(markdown) });
};
