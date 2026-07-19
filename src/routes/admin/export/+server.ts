import { createPortableExport } from "$lib/server/content/portable-export";
import { requireRuntimeEnv } from "$lib/server/env";

import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ locals, platform }) => {
  if (!locals.owner) return new Response("Unauthorized", { status: 401 });
  const exported = await createPortableExport(requireRuntimeEnv(platform), locals.owner.subject);
  const day = exported.manifest.generatedAt.slice(0, 10);
  return new Response(exported.stream, {
    headers: {
      "cache-control": "private, no-store",
      "content-disposition": `attachment; filename="aamirazad-content-${day}.tar"`,
      "content-type": "application/x-tar",
      "x-content-type-options": "nosniff",
    },
  });
};
