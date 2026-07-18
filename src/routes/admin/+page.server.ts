import { fail, redirect } from "@sveltejs/kit";

import { FORMATS, isPostFormat, isSeries, SERIES } from "$lib/content";
import { createPost, listPosts } from "$lib/server/content/posts";
import { requireRuntimeEnv } from "$lib/server/env";

import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals, platform }) => ({
  owner: locals.owner,
  posts: await listPosts(requireRuntimeEnv(platform)),
  series: SERIES,
  formats: FORMATS,
});

export const actions: Actions = {
  create: async ({ request, locals, platform }) => {
    const data = await request.formData();
    const series = data.get("series");
    const format = data.get("format");
    if (!isSeries(series) || !isPostFormat(format) || !locals.owner) {
      return fail(400, { message: "Choose a valid series and format." });
    }
    const post = await createPost(
      requireRuntimeEnv(platform),
      series,
      format,
      locals.owner.subject,
    );
    redirect(303, `/admin/posts/${post.id}`);
  },
};
