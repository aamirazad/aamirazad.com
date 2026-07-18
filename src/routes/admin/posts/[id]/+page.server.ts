import { error, fail, redirect } from "@sveltejs/kit";

import { isPostFormat, isSeries, parseDraftInput } from "$lib/content";
import { updateAssetMetadata, uploadPostAsset } from "$lib/server/content/assets";
import { renderMarkdown } from "$lib/server/content/markdown";
import {
  createRevision,
  getPost,
  listPostAssets,
  listRevisions,
  restoreRevision,
  updateDraft,
} from "$lib/server/content/posts";
import { requireRuntimeEnv } from "$lib/server/env";

import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params, platform }) => {
  const env = requireRuntimeEnv(platform);
  const post = await getPost(env, params.id);
  if (!post) error(404, "Post not found");
  const [assets, revisions, previewHtml] = await Promise.all([
    listPostAssets(env, post.id),
    listRevisions(env, post.id),
    renderMarkdown(post.bodyMarkdown),
  ]);
  return { post, assets, revisions, previewHtml };
};

export const actions: Actions = {
  checkpoint: async (event) => {
    const saved = await saveSubmittedDraft(event);
    if (saved && "failure" in saved) return saved;
    if (!event.locals.owner) return fail(401);
    await createRevision(
      requireRuntimeEnv(event.platform),
      event.params.id,
      event.locals.owner.subject,
    );
    redirect(303, `/admin/posts/${event.params.id}?saved=revision`);
  },
  restore: async ({ request, params, platform, locals }) => {
    const data = await request.formData();
    const revisionId = data.get("revisionId");
    if (typeof revisionId !== "string" || !locals.owner)
      return fail(400, { message: "Choose a revision." });
    try {
      await restoreRevision(
        requireRuntimeEnv(platform),
        params.id,
        revisionId,
        locals.owner.subject,
      );
    } catch {
      return fail(404, { message: "That revision no longer exists." });
    }
    redirect(303, `/admin/posts/${params.id}?restored=1`);
  },
  upload: async ({ request, params, platform, locals }) => {
    const data = await request.formData();
    const file = data.get("image");
    const altText = String(data.get("altText") ?? "");
    const caption = String(data.get("caption") ?? "");
    if (!(file instanceof File) || !locals.owner) return fail(400, { message: "Choose an image." });
    try {
      await uploadPostAsset(
        requireRuntimeEnv(platform),
        params.id,
        file,
        altText,
        caption,
        locals.owner.subject,
      );
    } catch (caught) {
      return fail(400, {
        message: caught instanceof Error ? caught.message : "Image upload failed.",
      });
    }
    redirect(303, `/admin/posts/${params.id}?uploaded=1`);
  },
  asset: async ({ request, params, platform, locals }) => {
    const data = await request.formData();
    const assetId = data.get("assetId");
    if (typeof assetId !== "string" || !locals.owner)
      return fail(400, { message: "Invalid image." });
    const updated = await updateAssetMetadata(
      requireRuntimeEnv(platform),
      params.id,
      assetId,
      String(data.get("altText") ?? ""),
      String(data.get("caption") ?? ""),
      locals.owner.subject,
    );
    if (!updated) return fail(404, { message: "Image not found." });
    redirect(303, `/admin/posts/${params.id}?asset=saved`);
  },
};

async function saveSubmittedDraft(event: Parameters<Actions[string]>[0]) {
  const data = await event.request.formData();
  const raw = Object.fromEntries(data);
  const input = parseDraftInput({ ...raw, version: Number(raw.version) });
  if (!input || !isSeries(input.series) || !isPostFormat(input.format) || !event.locals.owner) {
    return fail(400, { message: "The draft contains invalid values." });
  }
  const result = await updateDraft(requireRuntimeEnv(event.platform), event.params.id, input);
  if (result === "conflict")
    return fail(409, { message: "A newer copy exists. Reload before saving a revision." });
  if (!result) return fail(404, { message: "Post not found." });
  return result;
}
