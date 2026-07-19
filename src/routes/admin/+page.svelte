<script lang="ts">
  import { replaceState } from "$app/navigation";
  import SeriesPicker from "$lib/components/SeriesPicker.svelte";
  import {
    FORMATS,
    slugify,
    titlePrefix,
    type DraftInput,
    type EditablePost,
    type PostFormat,
    type Series,
    type ValidationIssue,
  } from "$lib/content";
  import { onMount } from "svelte";

  let { data } = $props();
  let series = $state<Series>("on");
  let format = $state<PostFormat>("article");
  let headline = $state("");
  let slug = $state("");
  let summary = $state("");
  let bodyMarkdown = $state("");
  let sourceUrl = $state("");
  let sourceTitle = $state("");
  let sourceDescription = $state("");
  let quoteText = $state("");
  let quoteAttribution = $state("");
  let postId = $state<string | null>(null);
  let durablePost = $state<EditablePost | null>(null);
  let version = $state(0);
  let updatedAt = $state("");
  let saveState = $state<"ready" | "saving" | "saved" | "offline" | "conflict">("ready");
  let message = $state("");
  let issues = $state<ValidationIssue[]>([]);
  let jobStatus = $state("");
  let ready = false;
  let titleInput: HTMLInputElement;
  let bodyInput: HTMLTextAreaElement;
  let fileInput: HTMLInputElement;
  let uploading = $state(false);
  let draggingImage = $state(false);
  let timer: ReturnType<typeof setTimeout> | undefined;
  let savePromise: Promise<void> | null = null;
  let lastSaved = "";
  const recoveryKey = "publishing:new-composer";

  onMount(() => {
    const recovered = localStorage.getItem(recoveryKey);
    if (recovered) {
      try {
        const value = JSON.parse(recovered) as ReturnType<typeof recoverySnapshot>;
        series = value.series;
        format = value.format;
        headline = value.headline;
        slug = value.slug;
        summary = value.summary;
        bodyMarkdown = value.bodyMarkdown;
        sourceUrl = value.sourceUrl;
        sourceTitle = value.sourceTitle;
        sourceDescription = value.sourceDescription;
        quoteText = value.quoteText;
        quoteAttribution = value.quoteAttribution;
        message = "Recovered unsent writing from this browser.";
      } catch {
        localStorage.removeItem(recoveryKey);
      }
    }
    ready = true;
    titleInput.focus();
    const retry = () => void persistUntilCurrent();
    window.addEventListener("online", retry);
    return () => window.removeEventListener("online", retry);
  });

  $effect(() => {
    const snapshot = contentSnapshot();
    if (!ready || snapshot === lastSaved || !meaningful()) return;
    localStorage.setItem(currentRecoveryKey(), JSON.stringify(recoveryPayload()));
    clearTimeout(timer);
    timer = setTimeout(() => void persistUntilCurrent(), 850);
  });

  function fullTitle(): string {
    return `${titlePrefix(series)}${headline.trimStart()}`.trimEnd();
  }

  function meaningful(): boolean {
    return Boolean(
      headline.trim() ||
      bodyMarkdown.trim() ||
      summary.trim() ||
      sourceUrl.trim() ||
      quoteText.trim(),
    );
  }

  function draftInput(): DraftInput {
    return {
      series,
      format,
      title: fullTitle(),
      slug,
      summary,
      bodyMarkdown,
      sourceUrl,
      sourceTitle,
      sourceDescription,
      quoteText,
      quoteAttribution,
      version,
    };
  }

  async function persistUntilCurrent(): Promise<void> {
    if (!meaningful()) return;
    if (savePromise) return savePromise;
    savePromise = persistLoop();
    try {
      await savePromise;
    } finally {
      savePromise = null;
    }
  }

  async function persistLoop(): Promise<void> {
    while (meaningful() && contentSnapshot() !== lastSaved) {
      const expected = contentSnapshot();
      const input = draftInput();
      saveState = "saving";
      try {
        const response = await fetch(postId ? `/api/posts/${postId}` : "/api/posts", {
          method: postId ? "PATCH" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(input),
        });
        if (response.status === 409) {
          saveState = "conflict";
          message = "This draft changed in another session. Reload before continuing.";
          return;
        }
        if (!response.ok) throw new Error("Autosave failed");
        const result = (await response.json()) as {
          post: EditablePost;
          issues: ValidationIssue[];
        };
        postId = result.post.id;
        durablePost = result.post;
        version = result.post.version;
        updatedAt = result.post.updatedAt;
        slug = result.post.slug;
        issues = result.issues;
        lastSaved = expected;
        saveState = "saved";
        message = "";
        localStorage.removeItem(currentRecoveryKey());
        localStorage.removeItem(recoveryKey);
        replaceState(`/admin/posts/${postId}`, {});
      } catch {
        saveState = "offline";
        message = "Writing is safe in this browser. Autosave will retry when you are online.";
        return;
      }
    }
  }

  async function publish() {
    if (!meaningful()) {
      message = "Start with a title or some writing before publishing.";
      return;
    }
    if (!headline.trim()) {
      message = "Finish the title before publishing.";
      return;
    }
    await persistUntilCurrent();
    if (!postId || saveState === "offline" || saveState === "conflict") return;
    saveState = "saving";
    let response: Response;
    let result: {
      jobId?: string;
      post?: EditablePost;
      issues?: ValidationIssue[];
      message?: string;
    };
    try {
      response = await fetch(`/api/posts/${postId}/publish`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(draftInput()),
      });
      result = (await response.json()) as typeof result;
    } catch {
      saveState = "offline";
      message = "Publishing could not start. Your draft remains saved; try again when online.";
      return;
    }
    if (result.post) {
      durablePost = result.post;
      version = result.post.version;
      slug = result.post.slug;
      lastSaved = contentSnapshot();
    }
    if (!response.ok || !result.jobId || !result.post) {
      issues = result.issues ?? [];
      message = result.message ?? "Resolve the items below before publishing.";
      saveState = response.status === 409 ? "conflict" : "saved";
      return;
    }
    version = result.post.version;
    slug = result.post.slug;
    lastSaved = contentSnapshot();
    saveState = "saved";
    jobStatus = "queued";
    await pollJob(result.jobId, `/${series}/${slug}`);
  }

  async function pollJob(jobId: string, destination: string) {
    for (let attempt = 0; attempt < 90; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 1_000));
      let response: Response;
      try {
        response = await fetch(`/api/publish-jobs/${jobId}`);
      } catch {
        jobStatus = "";
        message = "Publication status is temporarily unavailable. Your draft remains saved.";
        return;
      }
      if (!response.ok) {
        jobStatus = "";
        message = "Publication status could not be read. Your draft remains saved.";
        return;
      }
      const job = (await response.json()) as { status: string; errorMessage: string | null };
      jobStatus = job.status;
      if (job.status === "complete") {
        localStorage.removeItem(recoveryKey);
        if (postId) localStorage.removeItem(`publishing:draft:${postId}`);
        location.assign(destination);
        return;
      }
      if (job.status === "failed") {
        message = job.errorMessage ?? "Publishing failed. Your draft remains saved.";
        jobStatus = "";
        return;
      }
    }
    jobStatus = "";
    message = "Publication is still running. You can safely retry or open the saved entry.";
  }

  function contentSnapshot(): string {
    return JSON.stringify(draftInput(), (key, value) => (key === "version" ? undefined : value));
  }

  function recoverySnapshot() {
    return {
      series,
      format,
      headline,
      slug,
      summary,
      bodyMarkdown,
      sourceUrl,
      sourceTitle,
      sourceDescription,
      quoteText,
      quoteAttribution,
      savedAt: updatedAt || new Date().toISOString(),
    };
  }

  function recoveryPayload() {
    if (!durablePost || !postId) return recoverySnapshot();
    return {
      savedAt: new Date().toISOString(),
      draft: {
        ...durablePost,
        ...draftInput(),
        id: postId,
        version,
        updatedAt,
      },
    };
  }

  function currentRecoveryKey(): string {
    return postId ? `publishing:draft:${postId}` : recoveryKey;
  }

  async function uploadImages(files: FileList | File[]) {
    const images = Array.from(files).filter((file) => file.type.startsWith("image/"));
    if (!images.length) {
      message = "Drop or choose a JPEG, PNG, WebP, or GIF image.";
      return;
    }
    if (!meaningful()) {
      message = "Add a title or some writing before attaching an image.";
      return;
    }
    uploading = true;
    message = `Compressing ${images.length === 1 ? "image" : `${images.length} images`}…`;
    try {
      await persistUntilCurrent();
      if (!postId || saveState === "offline" || saveState === "conflict") return;
      for (const image of images) {
        const data = new FormData();
        data.set("image", image);
        const response = await fetch(`/api/posts/${postId}/assets`, { method: "POST", body: data });
        const result = (await response.json()) as { markdown?: string; message?: string };
        if (!response.ok || !result.markdown)
          throw new Error(result.message ?? "Image upload failed.");
        insertMarkdown(result.markdown);
      }
      message = `${images.length === 1 ? "Image" : "Images"} compressed to WebP and inserted.`;
    } catch (caught) {
      message = caught instanceof Error ? caught.message : "Image upload failed.";
    } finally {
      uploading = false;
      if (fileInput) fileInput.value = "";
    }
  }

  function insertMarkdown(markdown: string) {
    const start = bodyInput.selectionStart ?? bodyMarkdown.length;
    const end = bodyInput.selectionEnd ?? start;
    const before = bodyMarkdown.slice(0, start);
    const after = bodyMarkdown.slice(end);
    const prefix = before && !before.endsWith("\n") ? "\n\n" : "";
    const suffix = after && !after.startsWith("\n") ? "\n\n" : "";
    bodyMarkdown = `${before}${prefix}${markdown}${suffix}${after}`;
    const cursor = before.length + prefix.length + markdown.length;
    requestAnimationFrame(() => {
      bodyInput.focus();
      bodyInput.setSelectionRange(cursor, cursor);
    });
  }
</script>

<svelte:head>
  <title>Write · Aamir Azad</title>
  <meta name="robots" content="noindex, nofollow" />
</svelte:head>

<main class="shell admin-shell composer-shell">
  <nav class="site-nav" aria-label="Editor navigation">
    <a href="/admin">Publishing</a>
    <div class="editor-actions">
      <span
        class:warning={saveState === "offline" || saveState === "conflict"}
        class="save-status"
        aria-live="polite">{saveState}</span
      >
      <button class="primary-button" type="button" onclick={publish} disabled={Boolean(jobStatus)}>
        {jobStatus ? `Publishing: ${jobStatus}` : "Publish"}
      </button>
    </div>
  </nav>

  <header class="composer-header">
    <p class="eyebrow">New entry</p>
    <h1>What do you want to say?</h1>
  </header>

  {#if message}<p
      class:errored={saveState === "conflict"}
      class="notice"
      role={saveState === "conflict" ? "alert" : "status"}
    >
      {message}
    </p>{/if}
  {#if issues.length}<ul class="validation-list" aria-label="Publishing issues" role="alert">
      {#each issues as issue}<li>{issue.message}</li>{/each}
    </ul>{/if}

  <form class="composer" onsubmit={(event) => event.preventDefault()}>
    <SeriesPicker bind:value={series} />
    <label class="composer-title">
      <span>Title</span>
      <span class="title-line"
        ><strong aria-hidden="true">{titlePrefix(series)}</strong><input
          aria-label={`Title after the ${titlePrefix(series).trim()} prefix`}
          maxlength={180 - titlePrefix(series).length}
          bind:value={headline}
          bind:this={titleInput}
          placeholder="your subject"
        /></span
      >
    </label>
    <label
      class:dragging={draggingImage}
      class="composer-body"
      ondragenter={(event) => {
        if (event.dataTransfer?.types.includes("Files")) draggingImage = true;
      }}
      ondragover={(event) => event.preventDefault()}
      ondragleave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null))
          draggingImage = false;
      }}
      ondrop={(event) => {
        event.preventDefault();
        draggingImage = false;
        if (event.dataTransfer?.files) void uploadImages(event.dataTransfer.files);
      }}
    >
      <span>Markdown</span>
      <textarea
        rows="18"
        maxlength="250000"
        spellcheck="true"
        bind:value={bodyMarkdown}
        bind:this={bodyInput}
        placeholder="Start writing…"
      ></textarea>
    </label>
    <div class="composer-upload">
      <input
        class="visually-hidden"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        bind:this={fileInput}
        onchange={(event) => {
          if (event.currentTarget.files) void uploadImages(event.currentTarget.files);
        }}
      />
      <button
        class="button-link"
        type="button"
        disabled={uploading}
        onclick={() => fileInput.click()}
        >{uploading ? "Compressing image…" : "＋ Add image"}</button
      >
      <small>or drop an image into the editor</small>
    </div>

    <details class="composer-options">
      <summary>Format and details</summary>
      <fieldset>
        <legend>Format</legend>
        <div class="choice-buttons format-buttons">
          {#each FORMATS as choice}
            <label class:chosen={format === choice}>
              <input type="radio" name="format" bind:group={format} value={choice} />
              <span>{choice}</span>
            </label>
          {/each}
        </div>
      </fieldset>
      {#if format === "link"}
        <label>Destination URL<input type="url" maxlength="2048" bind:value={sourceUrl} /></label>
        <label>Source title<input maxlength="500" bind:value={sourceTitle} /></label>
        <label
          >Source description<textarea rows="3" maxlength="2000" bind:value={sourceDescription}
          ></textarea></label
        >
      {/if}
      {#if format === "quote"}
        <label
          >Quoted text<textarea rows="5" maxlength="10000" bind:value={quoteText}></textarea></label
        >
        <label>Attribution<input maxlength="500" bind:value={quoteAttribution} /></label>
      {/if}
      {#if format === "photo"}
        <p class="field-help">Image tools appear as soon as this draft has meaningful text.</p>
        {#if postId}<a class="secondary-button" href={`/admin/posts/${postId}#images`}>Add images</a
          >{/if}
      {/if}
      <label>Summary<textarea rows="3" maxlength="500" bind:value={summary}></textarea></label>
      <label
        >Slug<input
          maxlength="96"
          bind:value={slug}
          placeholder={slugify(headline) || "generated-from-title"}
        /></label
      >
    </details>
  </form>

  <details class="drafts secondary-workspace">
    <summary>Existing entries ({data.posts.length})</summary>
    {#if data.posts.length === 0}
      <p>No saved entries yet.</p>
    {:else}
      <ol class="draft-list">
        {#each data.posts as post}
          <li>
            <a href={`/admin/posts/${post.id}`}>
              <span>{post.title.trim() || "Untitled"}</span>
              <small>{post.series} · {post.format} · {post.status}</small>
            </a>
          </li>
        {/each}
      </ol>
    {/if}
  </details>

  <details class="secondary-workspace">
    <summary>Recovery tools</summary>
    <div class="compact-panel">
      <p>Download Markdown, metadata, media, and the current public projection.</p>
      <form method="POST" action="/admin/export">
        <button type="submit">Export content</button>
      </form>
    </div>
  </details>

  <form method="POST" action="/auth/logout" class="logout-form">
    <button class="button-link" type="submit">Log out</button>
  </form>
</main>
