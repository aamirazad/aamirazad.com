<script lang="ts">
  import { onMount } from "svelte";
  import EditorBreadcrumbs from "$lib/components/EditorBreadcrumbs.svelte";
  import RenderedMarkdown from "$lib/components/RenderedMarkdown.svelte";
  import SeriesPicker from "$lib/components/SeriesPicker.svelte";

  let { data, form } = $props();
  // svelte-ignore state_referenced_locally -- page data intentionally seeds an editable client copy
  let draft = $state({ ...data.post });
  // svelte-ignore state_referenced_locally -- server-rendered HTML is the initial preview
  let previewHtml = $state(data.previewHtml);
  let saveState = $state<"saved" | "saving" | "offline" | "conflict">("saved");
  let recoveryMessage = $state("");
  let linkMessage = $state("");
  let issues = $state<{ field: string; message: string }[]>([]);
  // svelte-ignore state_referenced_locally -- server job state intentionally seeds the polling state
  let job = $state(data.job);
  let ready = false;
  let saveTimer: ReturnType<typeof setTimeout> | undefined;
  let previewTimer: ReturnType<typeof setTimeout> | undefined;
  // svelte-ignore state_referenced_locally -- baseline is intentionally captured before editing starts
  let lastSaved = contentSnapshot(draft);
  // svelte-ignore state_referenced_locally -- the post ID cannot change during this page instance
  const recoveryKey = `publishing:draft:${data.post.id}`;

  onMount(() => {
    const recovered = localStorage.getItem(recoveryKey);
    if (recovered) {
      try {
        const entry = JSON.parse(recovered) as { savedAt: string; draft: typeof draft };
        if (entry.savedAt > data.post.updatedAt && contentSnapshot(entry.draft) !== lastSaved) {
          draft = { ...entry.draft, version: data.post.version, updatedAt: data.post.updatedAt };
          recoveryMessage = "Recovered unsent changes from this browser.";
        }
      } catch {
        localStorage.removeItem(recoveryKey);
      }
    }
    ready = true;
    if (job && job.status !== "complete" && job.status !== "failed") void pollJob(job.id);
  });

  $effect(() => {
    const snapshot = contentSnapshot(draft);
    if (!ready || snapshot === lastSaved) return;
    localStorage.setItem(recoveryKey, JSON.stringify({ savedAt: new Date().toISOString(), draft }));
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => void saveDraft(snapshot), 850);
  });

  $effect(() => {
    const markdown = draft.bodyMarkdown;
    if (!ready) return;
    clearTimeout(previewTimer);
    previewTimer = setTimeout(() => void refreshPreview(markdown), 350);
  });

  async function saveDraft(expectedSnapshot = contentSnapshot(draft)) {
    saveState = "saving";
    try {
      const response = await fetch(`/api/posts/${draft.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(draft),
      });
      if (response.status === 409) {
        saveState = "conflict";
        return;
      }
      if (!response.ok) throw new Error("Autosave failed");
      const result = (await response.json()) as { post: typeof draft; issues: typeof issues };
      if (contentSnapshot(draft) === expectedSnapshot) {
        draft.version = result.post.version;
        draft.updatedAt = result.post.updatedAt;
        draft.slug = result.post.slug;
        lastSaved = contentSnapshot(draft);
        issues = result.issues;
        localStorage.removeItem(recoveryKey);
        saveState = "saved";
        recoveryMessage = "";
      }
    } catch {
      saveState = "offline";
    }
  }

  async function refreshPreview(markdown: string) {
    try {
      const response = await fetch("/api/preview", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ markdown }),
      });
      if (response.ok && markdown === draft.bodyMarkdown)
        previewHtml = ((await response.json()) as { html: string }).html;
    } catch {
      /* Autosave status already communicates connectivity. */
    }
  }

  async function fetchMetadata() {
    linkMessage = "Fetching metadata…";
    try {
      const response = await fetch("/api/link-metadata", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: draft.sourceUrl }),
      });
      const result = (await response.json()) as {
        error?: string;
        url?: string;
        title?: string;
        description?: string;
      };
      if (!response.ok) throw new Error(result.error ?? "Metadata fetch failed");
      draft.sourceUrl = result.url ?? draft.sourceUrl;
      draft.sourceTitle = result.title ?? "";
      draft.sourceDescription = result.description ?? "";
      linkMessage = "Metadata loaded. You can edit it before saving.";
    } catch (caught) {
      linkMessage = caught instanceof Error ? caught.message : "Metadata fetch failed.";
    }
  }

  async function pollJob(jobId: string) {
    for (let attempt = 0; attempt < 90; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 1_000));
      const response = await fetch(`/api/publish-jobs/${jobId}`);
      if (!response.ok) return;
      job = (await response.json()) as typeof job;
      if (job?.status === "complete") {
        location.replace(`/admin/posts/${draft.id}?published=1`);
        return;
      }
      if (job?.status === "failed") return;
    }
  }

  function contentSnapshot(value: typeof draft): string {
    return JSON.stringify({
      series: value.series,
      format: value.format,
      title: value.title,
      slug: value.slug,
      summary: value.summary,
      bodyMarkdown: value.bodyMarkdown,
      sourceUrl: value.sourceUrl,
      sourceTitle: value.sourceTitle,
      sourceDescription: value.sourceDescription,
      quoteText: value.quoteText,
      quoteAttribution: value.quoteAttribution,
    });
  }
</script>

<svelte:head
  ><title>{draft.title.trim() || "Untitled"} · Editor</title><meta
    name="robots"
    content="noindex, nofollow"
  /></svelte:head
>

<main class="mx-auto w-[min(calc(100%-2rem),1440px)] pt-6 pb-20">
  <header
    class="sticky top-0 z-10 -mx-[0.6rem] flex items-center justify-between gap-4 bg-[color-mix(in_srgb,var(--color-background)_92%,transparent)] px-[0.6rem] py-[0.8rem] backdrop-blur-xl max-sm:flex-col max-sm:items-start"
  >
    <EditorBreadcrumbs />
    <div
      class="flex items-center justify-between gap-4 max-sm:w-full max-sm:flex-wrap max-sm:justify-start"
    >
      <span
        class:text-[#ffb4a9]={saveState === "offline" || saveState === "conflict"}
        class:text-soft={saveState !== "offline" && saveState !== "conflict"}
        class="min-w-16 text-right text-[0.8rem] capitalize max-sm:order-3 max-sm:w-full max-sm:text-left"
        aria-live="polite">{saveState}</span
      >
      <a class="secondary-button" href={`/preview/${draft.id}`} target="_blank">Full preview</a>
      <button class="secondary-button" type="submit" form="checkpoint-form">Save revision</button>
      <button class="primary-button" type="submit" form="checkpoint-form" formaction="?/publish"
        >Publish</button
      >
      {#if draft.status === "published"}
        <button class="secondary-button" type="submit" form="archive-form">Archive</button>
      {/if}
    </div>
  </header>

  {#if recoveryMessage}<p
      class="mt-4 mb-0 rounded-[0.4rem] border border-[#384b39] bg-[#121a13] px-4 py-3 text-[#c8dcc9]"
      role="status"
    >
      {recoveryMessage}
    </p>{/if}
  {#if saveState === "conflict"}<p
      class="mt-4 mb-0 rounded-[0.4rem] border border-[#62332d] bg-[#211310] px-4 py-3 text-[#ffb4a9]"
      role="alert"
    >
      This draft was changed elsewhere. Copy any unsaved text, then reload to resolve the conflict.
    </p>{/if}
  {#if form?.message}<p
      class="mt-4 mb-0 rounded-[0.4rem] border border-[#62332d] bg-[#211310] px-4 py-3 text-[#ffb4a9]"
      role="alert"
    >
      {form.message}
    </p>{/if}
  {#if job}
    <p
      class:border-[#62332d]={job.status === "failed"}
      class:bg-[#211310]={job.status === "failed"}
      class:text-[#ffb4a9]={job.status === "failed"}
      class="mt-4 mb-0 rounded-[0.4rem] border border-[#384b39] bg-[#121a13] px-[0.9rem] py-[0.7rem] text-[#c8dcc9] capitalize"
      aria-live="polite"
    >
      {job.operation === "archive" ? "Archiving" : "Publishing"}: {job.status}{job.errorMessage
        ? ` — ${job.errorMessage}`
        : ""}
    </p>
  {/if}
  {#if issues.length}<ul
      class="mt-4 mb-0 rounded-[0.4rem] border border-[#62332d] bg-[#211310] px-4 py-3 pl-8 text-[#ffb4a9]"
    >
      {#each issues as issue}<li>{issue.message}</li>{/each}
    </ul>{/if}

  <form
    id="checkpoint-form"
    method="POST"
    action="?/checkpoint"
    class="mt-6 grid grid-cols-[minmax(0,1fr)_minmax(22rem,0.8fr)] gap-6 max-sm:grid-cols-1"
  >
    <input type="hidden" name="version" value={draft.version} />
    <section class="grid gap-4" aria-label="Draft fields">
      <SeriesPicker bind:value={draft.series} />
      <div class="flex items-center justify-between gap-4 max-sm:flex-col max-sm:items-stretch">
        <label class="flex-1"
          >Format<select name="format" bind:value={draft.format}
            ><option value="article">article</option><option value="note">note</option><option
              value="link">link</option
            ><option value="quote">quote</option><option value="photo">photo</option></select
          ></label
        >
      </div>
      <label>Title<input name="title" maxlength="180" bind:value={draft.title} /></label>
      <details class="grid gap-4 border-y border-border open:pb-5 [&>:not(summary)]:mx-0">
        <summary class="cursor-pointer py-[0.9rem] font-[650] text-muted">
          Slug and summary
        </summary>
        <label
          >Slug<input
            name="slug"
            maxlength="96"
            bind:value={draft.slug}
            placeholder="generated-from-title"
          /></label
        >
        <label
          >Summary<textarea name="summary" rows="3" maxlength="500" bind:value={draft.summary}
          ></textarea></label
        >
      </details>
      {#if draft.format === "link"}
        <fieldset>
          <legend>Link</legend>
          <label
            >Destination URL<input
              name="sourceUrl"
              type="url"
              maxlength="2048"
              bind:value={draft.sourceUrl}
            /></label
          >
          <button class="secondary-button" type="button" onclick={fetchMetadata}
            >Fetch metadata</button
          >
          {#if linkMessage}<p class="text-[0.8rem] text-soft" aria-live="polite">
              {linkMessage}
            </p>{/if}
          <label
            >Source title<input
              name="sourceTitle"
              maxlength="500"
              bind:value={draft.sourceTitle}
            /></label
          >
          <label
            >Source description<textarea
              name="sourceDescription"
              rows="3"
              maxlength="2000"
              bind:value={draft.sourceDescription}></textarea></label
          >
        </fieldset>
      {:else}
        <input type="hidden" name="sourceUrl" value={draft.sourceUrl} /><input
          type="hidden"
          name="sourceTitle"
          value={draft.sourceTitle}
        /><input type="hidden" name="sourceDescription" value={draft.sourceDescription} />
      {/if}

      {#if draft.format === "quote"}
        <fieldset>
          <legend>Quote</legend>
          <label
            >Quoted text<textarea
              name="quoteText"
              rows="5"
              maxlength="10000"
              bind:value={draft.quoteText}></textarea></label
          >
          <label
            >Attribution<input
              name="quoteAttribution"
              maxlength="500"
              bind:value={draft.quoteAttribution}
            /></label
          >
        </fieldset>
      {:else}
        <input type="hidden" name="quoteText" value={draft.quoteText} /><input
          type="hidden"
          name="quoteAttribution"
          value={draft.quoteAttribution}
        />
      {/if}

      <label
        >Markdown<textarea
          class="min-h-128 font-mono text-sm max-sm:min-h-88"
          name="bodyMarkdown"
          rows="22"
          maxlength="250000"
          spellcheck="true"
          bind:value={draft.bodyMarkdown}
          placeholder="Write in Markdown…"></textarea></label
      >
    </section>

    <aside
      class="sticky top-22 max-h-[calc(100vh-7rem)] min-h-140 self-start overflow-auto border-l border-border pl-6 max-sm:static max-sm:max-h-none max-sm:min-h-0 max-sm:border-t max-sm:border-l-0 max-sm:pt-6 max-sm:pl-0"
      aria-label="Live Markdown preview"
    >
      <p class="eyebrow">Live preview</p>
      <article>
        <h1 class="text-[clamp(2rem,5vw,3rem)]">{draft.title || "Untitled"}</h1>
        {#if draft.summary}<p class="text-[1.1rem] text-muted">{draft.summary}</p>{/if}
        {#if draft.format === "link" && draft.sourceUrl}<p>
            <a href={draft.sourceUrl}>{draft.sourceTitle || draft.sourceUrl} ↗</a>
          </p>{/if}
        {#if draft.format === "quote" && draft.quoteText}<blockquote>
            <p>{draft.quoteText}</p>
            <footer>— {draft.quoteAttribution}</footer>
          </blockquote>{/if}
        <RenderedMarkdown html={previewHtml} />
      </article>
    </aside>
  </form>
  <form id="archive-form" method="POST" action="?/archive"></form>

  <section class="mt-6 grid grid-cols-2 gap-6 max-sm:grid-cols-1">
    <div class="border-t border-border pt-5" id="images">
      <h2>Images</h2>
      <form method="POST" action="?/upload" enctype="multipart/form-data" class="grid gap-[0.9rem]">
        <label
          >Image<input
            name="image"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            capture="environment"
            required
          /></label
        >
        <label
          >Alt text<input
            name="altText"
            maxlength="1000"
            placeholder="Describe what the image conveys"
          /></label
        >
        <label>Caption<input name="caption" maxlength="2000" /></label>
        <button class="secondary-button" type="submit">Upload original</button>
      </form>
      {#if data.assets.length}
        <div class="mt-6 grid gap-4">
          {#each data.assets as asset}
            <form
              method="POST"
              action="?/asset"
              class="grid gap-[0.9rem] border-t border-border pt-4"
            >
              <img
                class="block h-auto max-h-112 w-full rounded-[0.35rem] bg-[#080808] object-contain"
                src={`/api/assets/${asset.id}`}
                alt={asset.altText}
              />
              <input type="hidden" name="assetId" value={asset.id} />
              <p>
                <strong>{asset.originalFilename}</strong><br /><small
                  >{asset.width}×{asset.height} · {Math.ceil(asset.byteSize / 1024)} KB</small
                >
              </p>
              <label>Alt text<input name="altText" maxlength="1000" value={asset.altText} /></label>
              <label>Caption<input name="caption" maxlength="2000" value={asset.caption} /></label>
              <button class="secondary-button" type="submit">Save image details</button>
            </form>
          {/each}
        </div>
      {/if}
    </div>

    <div class="border-t border-border pt-5">
      <h2>Revision history</h2>
      {#if data.revisions.length === 0}<p>Create a save point to begin revision history.</p>{:else}
        <ol class="m-0 list-none p-0">
          {#each data.revisions as revision}<li
              class="flex items-center justify-between gap-4 border-b border-border py-[0.8rem]"
            >
              <div>
                <strong>{revision.title || "Untitled"}</strong><small class="block"
                  >{revision.reason} · {new Date(revision.createdAt).toLocaleString()}</small
                >
              </div>
              <form method="POST" action="?/restore">
                <input type="hidden" name="revisionId" value={revision.id} /><button
                  class="button-link"
                  type="submit">Restore</button
                >
              </form>
            </li>{/each}
        </ol>
      {/if}
    </div>
  </section>
</main>
