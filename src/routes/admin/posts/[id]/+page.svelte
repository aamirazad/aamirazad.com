<script lang="ts">
  import { onMount } from "svelte";
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

<main class="editor-shell">
  <nav class="editor-nav" aria-label="Editor navigation">
    <a href="/admin">← All entries</a>
    <div class="editor-actions">
      <span
        class:warning={saveState === "offline" || saveState === "conflict"}
        class="save-status"
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
  </nav>

  {#if recoveryMessage}<p class="notice" role="status">{recoveryMessage}</p>{/if}
  {#if saveState === "conflict"}<p class="notice error" role="alert">
      This draft was changed elsewhere. Copy any unsaved text, then reload to resolve the conflict.
    </p>{/if}
  {#if form?.message}<p class="notice error" role="alert">{form.message}</p>{/if}
  {#if job}
    <p class:errored={job.status === "failed"} class="publish-progress" aria-live="polite">
      {job.operation === "archive" ? "Archiving" : "Publishing"}: {job.status}{job.errorMessage
        ? ` — ${job.errorMessage}`
        : ""}
    </p>
  {/if}
  {#if issues.length}<ul class="validation-list">
      {#each issues as issue}<li>{issue.message}</li>{/each}
    </ul>{/if}

  <form id="checkpoint-form" method="POST" action="?/checkpoint" class="editor-grid">
    <input type="hidden" name="version" value={draft.version} />
    <section class="editor-fields" aria-label="Draft fields">
      <SeriesPicker bind:value={draft.series} />
      <div class="field-row">
        <label
          >Format<select name="format" bind:value={draft.format}
            ><option value="article">article</option><option value="note">note</option><option
              value="link">link</option
            ><option value="quote">quote</option><option value="photo">photo</option></select
          ></label
        >
      </div>
      <label>Title<input name="title" maxlength="180" bind:value={draft.title} /></label>
      <details class="composer-options">
        <summary>Slug and summary</summary>
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
          {#if linkMessage}<p class="field-help" aria-live="polite">{linkMessage}</p>{/if}
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
              bind:value={draft.sourceDescription}
            ></textarea></label
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
              bind:value={draft.quoteText}
            ></textarea></label
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

      <label class="markdown-field"
        >Markdown<textarea
          name="bodyMarkdown"
          rows="22"
          maxlength="250000"
          spellcheck="true"
          bind:value={draft.bodyMarkdown}
          placeholder="Write in Markdown…"
        ></textarea></label
      >
    </section>

    <aside class="live-preview" aria-label="Live Markdown preview">
      <p class="eyebrow">Live preview</p>
      <article>
        <h1>{draft.title || "Untitled"}</h1>
        {#if draft.summary}<p class="post-summary">{draft.summary}</p>{/if}
        {#if draft.format === "link" && draft.sourceUrl}<p>
            <a href={draft.sourceUrl}>{draft.sourceTitle || draft.sourceUrl} ↗</a>
          </p>{/if}
        {#if draft.format === "quote" && draft.quoteText}<blockquote>
            <p>{draft.quoteText}</p>
            <footer>— {draft.quoteAttribution}</footer>
          </blockquote>{/if}
        <div class="rendered-markdown">{@html previewHtml}</div>
      </article>
    </aside>
  </form>
  <form id="archive-form" method="POST" action="?/archive"></form>

  <section class="editor-lower-grid">
    <div class="panel" id="images">
      <h2>Images</h2>
      <form method="POST" action="?/upload" enctype="multipart/form-data" class="stacked-form">
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
        <div class="asset-list">
          {#each data.assets as asset}
            <form method="POST" action="?/asset" class="asset-card">
              <img src={`/api/assets/${asset.id}`} alt={asset.altText} />
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

    <div class="panel">
      <h2>Revision history</h2>
      {#if data.revisions.length === 0}<p>Create a save point to begin revision history.</p>{:else}
        <ol class="revision-list">
          {#each data.revisions as revision}<li>
              <div>
                <strong>{revision.title || "Untitled"}</strong><small
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
