import { error } from "@sveltejs/kit";

import { readPublishJob } from "$lib/server/content/publish";
import { requireRuntimeEnv } from "$lib/server/env";

import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ params, platform }) => {
  const job = await readPublishJob(requireRuntimeEnv(platform), params.id);
  if (!job) error(404, "Publish job not found");
  return Response.json(job);
};
