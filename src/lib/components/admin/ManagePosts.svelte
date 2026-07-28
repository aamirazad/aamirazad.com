<script lang="ts">
  import type { EditablePost } from "$lib/content";

  let { initialPosts }: { initialPosts: EditablePost[] } = $props();
  // svelte-ignore state_referenced_locally -- server data intentionally seeds a mutable client list
  let posts = $state([...initialPosts]);
  let deletingId = $state<string | null>(null);
  let message = $state("");
  let isError = $state(false);

  async function removePost(post: EditablePost) {
    if (
      !confirm(
        `Delete “${post.title.trim() || "Untitled"}”? This removes the post from the site and cannot be undone from the editor.`,
      )
    ) {
      return;
    }
    deletingId = post.id;
    message = post.status === "published" ? "Removing the published post…" : "Deleting post…";
    isError = false;
    try {
      let response = await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
      if (response.status === 202) {
        const result = (await response.json()) as { jobId: string };
        await waitForArchive(result.jobId);
        response = await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
      }
      if (!response.ok) {
        const result = (await response.json().catch(() => ({}))) as { message?: string };
        throw new Error(result.message ?? "The post could not be deleted.");
      }
      posts = posts.filter((item) => item.id !== post.id);
      message = "Post deleted.";
    } catch (caught) {
      isError = true;
      message = caught instanceof Error ? caught.message : "The post could not be deleted.";
    } finally {
      deletingId = null;
    }
  }

  async function waitForArchive(jobId: string) {
    for (let attempt = 0; attempt < 90; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 1_000));
      const response = await fetch(`/api/publish-jobs/${jobId}`);
      if (!response.ok) throw new Error("The archive status could not be read.");
      const job = (await response.json()) as { status: string; errorMessage: string | null };
      if (job.status === "complete") return;
      if (job.status === "failed") {
        throw new Error(job.errorMessage ?? "The published post could not be removed.");
      }
    }
    throw new Error("The post is still being removed. Try deleting it again in a moment.");
  }
</script>

<svelte:head>
  <title>Manage posts · Aamir Azad</title>
</svelte:head>

<header class="mt-2 mb-8">
  <h1 class="admin-heading m-0 text-[clamp(2rem,5vw,3.2rem)]">Manage posts</h1>
</header>

{#if message}
  <p
    class:text-[#ffb4a9]={isError}
    class="mb-6 rounded-xl bg-surface px-4 py-3 text-sm"
    role={isError ? "alert" : "status"}
  >
    {message}
  </p>
{/if}

{#if posts.length === 0}
  <p class="admin-card px-5 py-7">No saved posts yet.</p>
{:else}
  <ol class="m-0 grid list-none gap-3 p-0">
    {#each posts as post}
      <li
        class="admin-card grid grid-cols-[minmax(0,1fr)_auto] items-center gap-5 p-5 transition-colors duration-160 hover:bg-[#151515] max-sm:grid-cols-1"
      >
        <div class="min-w-0">
          <span
            class="post-status mb-2 inline-flex items-center gap-1.5 rounded-full bg-[#1b1b1b] px-2.5 py-1 text-[0.68rem] font-semibold tracking-[0.06em] text-soft uppercase"
            data-status={post.status}
          >
            <span class="size-1.5 rounded-full bg-current" aria-hidden="true"></span>
            {post.status}
          </span>
          <a
            class="block font-serif text-[1.25rem] font-semibold text-text no-underline hover:underline"
            href={`/admin/posts/${post.id}`}>{post.title.trim() || "Untitled"}</a
          >
          <p class="mt-1 mb-0 text-sm text-soft">
            <span class="capitalize">{post.series}</span> · {post.format} · updated
            {new Date(post.updatedAt).toLocaleDateString()}
          </p>
        </div>
        <div class="flex items-center gap-4">
          <a class="secondary-button !min-h-9 text-sm" href={`/admin/posts/${post.id}`}>Edit</a>
          <button
            class="button-link text-sm text-[#e9a39a]"
            type="button"
            disabled={deletingId === post.id}
            onclick={() => removePost(post)}
          >
            {deletingId === post.id ? "Deleting…" : "Delete"}
          </button>
        </div>
      </li>
    {/each}
  </ol>
{/if}

<style lang="postcss">
  @reference "../../../app.css";

  .post-status[data-status="published"] {
    @apply text-mint;
  }

  .post-status[data-status="draft"],
  .post-status[data-status="scheduled"] {
    @apply text-blue;
  }

  .post-status[data-status="publishing"] {
    @apply text-amber;
  }

  .post-status[data-status="failed"] {
    @apply text-[#e9a39a];
  }
</style>
