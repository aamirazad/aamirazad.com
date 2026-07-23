import { error } from "@sveltejs/kit";

import {
  CURRENT_PROJECTION_KEY,
  projectionKey,
  type ProjectionManifest,
  type PublishedIndex,
  type PublishedPost,
} from "$lib/published";
import type { RuntimeEnv } from "$lib/server/env";

export async function readManifest(env: RuntimeEnv): Promise<ProjectionManifest | null> {
  const object = await env.CONTENT.get(CURRENT_PROJECTION_KEY);
  return object ? object.json<ProjectionManifest>() : null;
}

export async function readPublishedPost(
  env: RuntimeEnv,
  path: string,
): Promise<{ post: PublishedPost } | { redirect: string } | null> {
  const manifest = await readManifest(env);
  if (!manifest) return null;
  const alias = manifest.aliases[path];
  if (alias) return { redirect: alias };
  const key = manifest.paths[path];
  if (!key) return null;
  const object = await env.CONTENT.get(key);
  return object ? { post: await object.json<PublishedPost>() } : null;
}

export async function readPublishedIndex(
  env: RuntimeEnv,
  name: string,
  page = 1,
): Promise<PublishedIndex> {
  return (await readPublishedIndexResult(env, name, page)).index;
}

export async function readPublishedIndexResult(
  env: RuntimeEnv,
  name: string,
  page = 1,
): Promise<{ index: PublishedIndex; generation: string; updatedAt: string }> {
  const manifest = await readManifest(env);
  if (!manifest) {
    return {
      index: { schemaVersion: 1, title: name, page: 1, totalPages: 1, items: [] },
      generation: "empty",
      updatedAt: new Date(0).toISOString(),
    };
  }
  const object = await env.CONTENT.get(
    projectionKey(manifest.generation, `indexes/${name}/${page}.json`),
  );
  if (!object) error(404, "Page not found");
  return {
    index: await object.json<PublishedIndex>(),
    generation: manifest.generation,
    updatedAt: manifest.updatedAt,
  };
}

export async function readGeneratedObject(
  env: RuntimeEnv,
  name: string,
): Promise<R2ObjectBody | null> {
  const manifest = await readManifest(env);
  return manifest ? env.CONTENT.get(projectionKey(manifest.generation, name)) : null;
}
