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

<header class="mt-12 mb-8 border-b border-border pb-7">
  <h1 class="m-0 text-[clamp(1.7rem,5vw,2.7rem)]">Manage posts</h1>
</header>

{#if message}
  <p
    class:text-[#ffb4a9]={isError}
    class="mb-6 border-l-2 border-border pl-3 text-sm"
    role={isError ? "alert" : "status"}
  >
    {message}
  </p>
{/if}

{#if posts.length === 0}
  <p class="border-y border-dashed border-border py-7">No saved posts yet.</p>
{:else}
  <ol class="m-0 list-none p-0">
    {#each posts as post}
      <li
        class="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-5 border-b border-border py-5 first:border-t max-sm:grid-cols-1"
      >
        <div class="min-w-0">
          <a
            class="font-serif text-[1.2rem] font-semibold text-text no-underline hover:underline"
            href={`/admin/posts/${post.id}`}>{post.title.trim() || "Untitled"}</a
          >
          <p class="mt-1 mb-0 text-sm text-soft">
            <span class="capitalize">{post.status}</span> · {post.series} · {post.format} · updated
            {new Date(post.updatedAt).toLocaleDateString()}
          </p>
        </div>
        <div class="flex items-center gap-4">
          <a class="text-sm font-semibold text-muted" href={`/admin/posts/${post.id}`}>Edit</a>
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
