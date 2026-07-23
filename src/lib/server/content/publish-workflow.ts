import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from "cloudflare:workers";

import { cacheTagForPath } from "$lib/published";
import {
  completeProjection,
  failProjection,
  prepareProjection,
  setJobStatus,
  writeProjection,
} from "$lib/server/content/projection";
import type { PublishWorkflowParams } from "$lib/server/content/publish";

type PublicCacheEntrypoint = {
  purgePublicCache(options: CachePurgeOptions): Promise<CachePurgeResult>;
};

export class PublishWorkflow extends WorkflowEntrypoint<Env, PublishWorkflowParams> {
  async run(
    event: Readonly<WorkflowEvent<PublishWorkflowParams>>,
    step: WorkflowStep,
  ): Promise<{ jobId: string }> {
    const { jobId } = event.payload;
    try {
      const prepared = await step.do("render immutable revision", async () =>
        prepareProjection(this.env, jobId),
      );
      const manifest = await step.do("write atomic public projection", async () =>
        writeProjection(this.env, prepared),
      );
      await step.do("purge affected public responses", async () => {
        await setJobStatus(this.env, jobId, "purging");
        const paths = [prepared.canonicalPath];
        for (const [alias, destination] of Object.entries(manifest.aliases)) {
          if (destination === prepared.canonicalPath) paths.push(alias);
        }
        const seriesTags = new Set(
          paths.map((path) => path.split("/").filter(Boolean)[0]).filter(Boolean),
        );
        const tags = [
          ...paths.map(cacheTagForPath),
          ...Array.from(seriesTags, (series) => `series-${series}`),
          "home",
          "archive",
          "feeds",
          "sitemap",
        ];
        // Workers Cache purges are scoped to the entrypoint that calls them. The Workflow is a
        // named entrypoint, so delegate invalidation to the default entrypoint that owns public
        // response cache entries.
        const publicCache = (this.ctx.exports as { default: PublicCacheEntrypoint }).default;
        const result = await publicCache.purgePublicCache({ tags: [...new Set(tags)] });
        if (!result.success) {
          throw new Error(
            `Cache purge failed: ${result.errors.map((item) => item.message).join(", ")}`,
          );
        }
      });
      await step.do("complete publication", async () => completeProjection(this.env, prepared));
      return { jobId };
    } catch (caught) {
      await step.do("record publication failure", async () =>
        failProjection(this.env, jobId, caught),
      );
      throw caught;
    }
  }
}
