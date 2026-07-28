<script lang="ts">
  import { replaceState } from "$app/navigation";
  import ManagePosts from "$lib/components/admin/ManagePosts.svelte";
  import ManageSiteContent from "$lib/components/admin/ManageSiteContent.svelte";
  import EditorBreadcrumbs from "$lib/components/EditorBreadcrumbs.svelte";
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
  type AdminView = "create" | "posts" | "links";
  let activeView = $state<AdminView>("create");
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
  // svelte-ignore non_reactive_update -- element bindings are imperative editor handles
  let titleInput: HTMLInputElement;
  // svelte-ignore non_reactive_update -- element bindings are imperative editor handles
  let bodyInput: HTMLTextAreaElement;
  // svelte-ignore non_reactive_update -- element bindings are imperative editor handles
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
    if (activeView === "create") titleInput.focus();
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

  function selectView(view: AdminView) {
    activeView = view;
    if (view === "create") requestAnimationFrame(() => titleInput?.focus());
  }
</script>

<svelte:head>
  <title>Write · Aamir Azad</title>
  <meta name="robots" content="noindex, nofollow" />
</svelte:head>

<main
  class="mx-auto grid w-[min(calc(100%-2.5rem),1180px)] grid-cols-[11.5rem_minmax(0,860px)] justify-center gap-[clamp(2.5rem,6vw,5rem)] py-8 pb-24 max-md:grid-cols-1 max-md:gap-7 max-sm:w-[min(calc(100%-2rem),1180px)]"
>
  <aside
    class="admin-card sticky top-8 z-20 self-start p-2 max-md:top-2 max-md:-mx-1 max-md:bg-[color-mix(in_srgb,var(--color-surface)_94%,transparent)] max-md:p-1 max-md:backdrop-blur-xl"
    aria-label="Admin tools"
  >
    <nav class="grid gap-1 max-md:grid-cols-3">
      <button
        class="flex cursor-pointer items-center gap-2 rounded-lg border-0 bg-transparent px-3 py-2.5 text-left text-sm font-semibold text-soft transition-colors hover:text-text aria-pressed:bg-[#222] aria-pressed:text-text max-md:justify-center max-md:px-1 max-md:text-center"
        type="button"
        aria-pressed={activeView === "create"}
        onclick={() => selectView("create")}
        ><span class="size-1.5 shrink-0 rounded-full bg-amber" aria-hidden="true"
        ></span>Create</button
      >
      <button
        class="flex cursor-pointer items-center gap-2 rounded-lg border-0 bg-transparent px-3 py-2.5 text-left text-sm font-semibold text-soft transition-colors hover:text-text aria-pressed:bg-[#222] aria-pressed:text-text max-md:justify-center max-md:px-1 max-md:text-center"
        type="button"
        aria-pressed={activeView === "posts"}
        onclick={() => selectView("posts")}
        ><span class="size-1.5 shrink-0 rounded-full bg-blue" aria-hidden="true"
        ></span>Posts</button
      >
      <button
        class="flex cursor-pointer items-center gap-2 rounded-lg border-0 bg-transparent px-3 py-2.5 text-left text-sm font-semibold text-soft transition-colors hover:text-text aria-pressed:bg-[#222] aria-pressed:text-text max-md:justify-center max-md:px-1 max-md:text-center"
        type="button"
        aria-pressed={activeView === "links"}
        onclick={() => selectView("links")}
        ><span class="size-1.5 shrink-0 rounded-full bg-violet" aria-hidden="true"
        ></span>Site</button
      >
    </nav>
    <form
      method="POST"
      action="/auth/logout"
      class="mt-3 border-t border-[#242424] px-2 pt-3 max-md:hidden"
    >
      <button class="button-link text-sm" type="submit">Log out</button>
    </form>
  </aside>

  <section class="min-w-0">
    <header class="site-nav !mb-10 !items-start md:min-h-10">
      <EditorBreadcrumbs />
      {#if activeView === "create"}
        <div
          class="flex items-center justify-between gap-4 max-sm:w-full max-sm:flex-wrap max-sm:justify-start"
        >
          <span
            class:text-[#ffb4a9]={saveState === "offline" || saveState === "conflict"}
            class:text-soft={saveState !== "offline" && saveState !== "conflict"}
            class="min-w-16 text-right text-[0.8rem] capitalize max-sm:order-3 max-sm:w-full max-sm:text-left"
            aria-live="polite">{saveState}</span
          >
          <button
            class="primary-button"
            type="button"
            onclick={publish}
            disabled={Boolean(jobStatus)}
          >
            {jobStatus ? `Publishing: ${jobStatus}` : "Publish"}
          </button>
        </div>
      {/if}
    </header>

    {#if activeView === "create"}
      <header class="mt-2 mb-8">
        <h1 class="admin-heading m-0 text-[clamp(2rem,5vw,3.2rem)]" data-accent="amber">
          What do you want to say?
        </h1>
      </header>

      {#if message}<p
          class:bg-[#211310]={saveState === "conflict"}
          class:text-[#ffb4a9]={saveState === "conflict"}
          class="mt-4 mb-0 rounded-xl bg-[#121a13] px-4 py-3 text-[#c8dcc9]"
          role={saveState === "conflict" ? "alert" : "status"}
        >
          {message}
        </p>{/if}
      {#if issues.length}<ul
          class="mt-4 mb-0 rounded-xl bg-[#211310] px-4 py-3 pl-8 text-[#ffb4a9]"
          aria-label="Publishing issues"
          role="alert"
        >
          {#each issues as issue}<li>{issue.message}</li>{/each}
        </ul>{/if}

      <form class="grid gap-[1.35rem]" onsubmit={(event) => event.preventDefault()}>
        <SeriesPicker bind:value={series} />
        <label>
          <span class="mb-2 p-0 text-xs font-[650] tracking-[0.12em] text-soft uppercase"
            >Title</span
          >
          <span
            class="admin-card flex items-baseline px-4 font-serif text-[clamp(1.65rem,5vw,2.5rem)] text-text"
            ><strong class="flex-none font-normal" aria-hidden="true">{titlePrefix(series)}</strong
            ><input
              class="min-h-16 min-w-0 !border-0 !bg-transparent px-[0.15em] !shadow-none [font:inherit]"
              aria-label={`Title after the ${titlePrefix(series).trim()} prefix`}
              maxlength={180 - titlePrefix(series).length}
              bind:value={headline}
              bind:this={titleInput}
              placeholder="your subject"
            /></span
          >
        </label>
        <label
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
          <span class="mb-2 p-0 text-xs font-[650] tracking-[0.12em] text-soft uppercase"
            >Markdown</span
          >
          <textarea
            class:ring-1={draggingImage}
            class:ring-text={draggingImage}
            class:bg-[#181818]={draggingImage}
            class:bg-surface={!draggingImage}
            class="min-h-[45vh] !border-0 p-5 text-base !shadow-none"
            rows="18"
            maxlength="250000"
            spellcheck="true"
            bind:value={bodyMarkdown}
            bind:this={bodyInput}
            placeholder="Start writing…"></textarea>
        </label>
        <div class="mt-[-0.45rem] flex items-baseline gap-3 text-soft">
          <input
            class="absolute size-px overflow-hidden border-0 p-0 whitespace-nowrap [clip:rect(0,0,0,0)]"
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

        <details class="admin-details grid gap-4 open:pb-5 [&>:not(summary)]:mx-0">
          <summary>Format and details</summary>
          <fieldset class="!bg-transparent !p-0">
            <legend>Format</legend>
            <div class="grid grid-cols-5 gap-[0.45rem] max-sm:grid-cols-2">
              {#each FORMATS as choice}
                <label
                  class="relative grid min-h-11 cursor-pointer place-items-center rounded-lg border-0 bg-[#181818] has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-focus"
                  class:bg-[#292929]={format === choice}
                  class:text-text={format === choice}
                  class:text-muted={format !== choice}
                >
                  <input
                    class="absolute min-h-px w-px opacity-0"
                    type="radio"
                    name="format"
                    bind:group={format}
                    value={choice}
                  />
                  <span>{choice}</span>
                </label>
              {/each}
            </div>
          </fieldset>
          {#if format === "link"}
            <label
              >Destination URL<input type="url" maxlength="2048" bind:value={sourceUrl} /></label
            >
            <label>Source title<input maxlength="500" bind:value={sourceTitle} /></label>
            <label
              >Source description<textarea rows="3" maxlength="2000" bind:value={sourceDescription}
              ></textarea></label
            >
          {/if}
          {#if format === "quote"}
            <label
              >Quoted text<textarea rows="5" maxlength="10000" bind:value={quoteText}
              ></textarea></label
            >
            <label>Attribution<input maxlength="500" bind:value={quoteAttribution} /></label>
          {/if}
          {#if format === "photo"}
            <p class="text-[0.8rem] text-soft">
              Image tools appear as soon as this draft has meaningful text.
            </p>
            {#if postId}<a class="secondary-button" href={`/admin/posts/${postId}#images`}
                >Add images</a
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

      <details class="admin-details mt-10 open:pb-5">
        <summary>Recovery tools</summary>
        <div
          class="flex items-center justify-between gap-4 max-sm:flex-col max-sm:items-start [&_:is(h2,p)]:my-0"
        >
          <p class="mt-[0.35rem]">
            Download Markdown, metadata, media, and the current public projection.
          </p>
          <form method="POST" action="/admin/export">
            <button type="submit">Export content</button>
          </form>
        </div>
      </details>
    {:else if activeView === "posts"}
      <ManagePosts initialPosts={data.posts} />
    {:else}
      <ManageSiteContent initialItems={data.siteItems} />
    {/if}

    <form method="POST" action="/auth/logout" class="mt-12 hidden max-md:block">
      <button class="button-link" type="submit">Log out</button>
    </form>
  </section>
</main>

<style>
  :global(html) {
    scrollbar-gutter: stable;
  }
</style>
