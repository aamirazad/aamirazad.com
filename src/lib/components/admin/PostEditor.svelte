<script lang="ts">
  import { goto } from "$app/navigation";
  import EditorBreadcrumbs from "$lib/components/EditorBreadcrumbs.svelte";
  import RenderedMarkdown from "$lib/components/RenderedMarkdown.svelte";
  import SeriesPicker from "$lib/components/SeriesPicker.svelte";
  import {
    FORMATS,
    slugify,
    titlePrefix,
    type DraftInput,
    type EditablePost,
    type ValidationIssue,
  } from "$lib/content";
  import { onMount } from "svelte";

  type Fields = Omit<DraftInput, "version">;

  let {
    post,
    hasUnpublishedChanges = false,
  }: { post: EditablePost | null; hasUnpublishedChanges?: boolean } = $props();

  const EMPTY: Fields = {
    series: "on",
    format: "article",
    title: "",
    slug: "",
    summary: "",
    bodyMarkdown: "",
    sourceUrl: "",
    sourceTitle: "",
    sourceDescription: "",
    quoteText: "",
    quoteAttribution: "",
    isListed: true,
  };

  // svelte-ignore state_referenced_locally -- the editor is remounted for each post
  const initial = post;
  let fields = $state<Fields>(pickFields(initial ?? EMPTY));
  let postId = $state(initial?.id ?? null);
  let version = $state(initial?.version ?? 0);
  let status = $state(initial?.status ?? "draft");
  let canonicalPath = $state(initial?.canonicalPath ?? null);
  // svelte-ignore state_referenced_locally -- seeded once from the server
  let liveIsStale = $state(hasUnpublishedChanges);
  let savedSnapshot = $state(snapshot(pickFields(initial ?? EMPTY)));
  let busy = $state<"" | "saving" | "publishing" | "unpublishing" | "uploading">("");
  let message = $state("");
  let isError = $state(false);
  let restored = $state(false);
  let issues = $state<ValidationIssue[]>([]);
  let mode = $state<"write" | "preview">("write");
  let previewHtml = $state("");
  let draggingImage = $state(false);
  let ready = false;
  let storeTimer: ReturnType<typeof setTimeout> | undefined;
  // svelte-ignore non_reactive_update -- element bindings are imperative editor handles
  let titleInput: HTMLInputElement;
  // svelte-ignore non_reactive_update -- element bindings are imperative editor handles
  let bodyInput: HTMLTextAreaElement;
  // svelte-ignore non_reactive_update -- element bindings are imperative editor handles
  let fileInput: HTMLInputElement;

  const unsaved = $derived(snapshot(fields) !== savedSnapshot);
  const isPublished = $derived(status === "published");

  onMount(() => {
    restoreLocalCopy();
    ready = true;
    if (!postId) titleInput.focus();
    return () => clearTimeout(storeTimer);
  });

  // Every edit is kept in this browser until it is saved, so nothing is lost on reload.
  $effect(() => {
    const current = snapshot(fields);
    const dirty = current !== savedSnapshot;
    if (!ready) return;
    clearTimeout(storeTimer);
    storeTimer = setTimeout(() => {
      if (dirty) {
        localStorage.setItem(storageKey(), JSON.stringify({ savedAt: Date.now(), fields }));
      } else {
        localStorage.removeItem(storageKey());
      }
    }, 250);
  });

  function storageKey(id = postId): string {
    return `draft:${id ?? "new"}`;
  }

  function restoreLocalCopy() {
    const legacyKey = postId ? `publishing:draft:${postId}` : "publishing:new-composer";
    const raw = localStorage.getItem(storageKey()) ?? localStorage.getItem(legacyKey);
    localStorage.removeItem(legacyKey);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as {
        fields?: Partial<Fields>;
        draft?: Partial<Fields>;
      } & Partial<Fields>;
      const local = pickFields({ ...EMPTY, ...(parsed.fields ?? parsed.draft ?? parsed) });
      if (snapshot(local) === savedSnapshot) {
        localStorage.removeItem(storageKey());
        return;
      }
      fields = local;
      restored = true;
    } catch {
      localStorage.removeItem(storageKey());
    }
  }

  function discardLocalCopy() {
    fields = pickFields(post ?? EMPTY);
    localStorage.removeItem(storageKey());
    restored = false;
  }

  function hasContent(): boolean {
    return Boolean(
      fields.title.trim() ||
      fields.bodyMarkdown.trim() ||
      fields.summary.trim() ||
      fields.sourceUrl.trim() ||
      fields.quoteText.trim(),
    );
  }

  function notify(text: string, error = false) {
    message = text;
    isError = error;
  }

  /**
   * Write the current fields to the server. Returns whether a new post was created, in which
   * case the caller moves to the post's own URL once its work is finished.
   */
  async function persist(): Promise<{ ok: boolean; created: boolean }> {
    if (!hasContent()) {
      notify("Add a title or some writing first.", true);
      return { ok: false, created: false };
    }
    const sent = { ...fields, title: fields.title.trim() };
    let response: Response;
    try {
      response = await fetch(postId ? `/api/posts/${postId}` : "/api/posts", {
        method: postId ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...sent, version }),
      });
    } catch {
      notify("Could not reach the server. Your writing is still kept in this browser.", true);
      return { ok: false, created: false };
    }
    const result = (await response.json().catch(() => ({}))) as {
      post?: EditablePost;
      issues?: ValidationIssue[];
      message?: string;
    };
    if (!response.ok || !result.post) {
      notify(result.message ?? "The draft could not be saved.", true);
      return { ok: false, created: false };
    }
    const created = !postId;
    accept(result.post, sent);
    if (status === "published") liveIsStale = true;
    issues = result.issues ?? [];
    return { ok: true, created };
  }

  /** Adopt the server's copy of what was just sent, keeping anything typed since. */
  function accept(saved: EditablePost, sent: Fields) {
    const previousKey = storageKey();
    postId = saved.id;
    version = saved.version;
    status = saved.status;
    canonicalPath = saved.canonicalPath;
    const typedSince = snapshot(fields) !== snapshot(sent);
    if (!typedSince && fields.slug === sent.slug) fields.slug = saved.slug;
    savedSnapshot = snapshot({ ...sent, slug: saved.slug });
    if (previousKey !== storageKey()) localStorage.removeItem(previousKey);
    if (typedSince) {
      localStorage.setItem(storageKey(), JSON.stringify({ savedAt: Date.now(), fields }));
    } else {
      localStorage.removeItem(storageKey());
    }
    restored = false;
  }

  async function openSavedPost(created: boolean) {
    if (created && postId) await goto(`/admin/posts/${postId}`, { replaceState: true });
  }

  async function saveDraft() {
    if (busy) return;
    busy = "saving";
    try {
      const { ok, created } = await persist();
      if (!ok) return;
      notify(isPublished ? "Draft saved. The public post is unchanged until you publish." : "");
      await openSavedPost(created);
    } finally {
      busy = "";
    }
  }

  async function publish() {
    if (busy) return;
    busy = "publishing";
    try {
      const created = !postId;
      if (created && !(await persist()).ok) return;
      const sent = { ...fields, title: fields.title.trim() };
      let response: Response;
      try {
        response = await fetch(`/api/posts/${postId}/publish`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ ...sent, version }),
        });
      } catch {
        notify("Could not reach the server. Your writing is still kept in this browser.", true);
        return;
      }
      const result = (await response.json().catch(() => ({}))) as {
        post?: EditablePost;
        issues?: ValidationIssue[];
        message?: string;
      };
      if (result.post) accept(result.post, sent);
      issues = result.issues ?? [];
      if (!response.ok) {
        notify(result.message ?? "Fix the items below, then publish again.", true);
        return;
      }
      liveIsStale = false;
      notify("Published.");
      await openSavedPost(created);
    } finally {
      busy = "";
    }
  }

  async function unpublish() {
    if (busy || !postId) return;
    if (!confirm("Take this post off the public site? The draft is kept.")) return;
    busy = "unpublishing";
    try {
      const response = await fetch(`/api/posts/${postId}/unpublish`, { method: "POST" });
      const result = (await response.json().catch(() => ({}))) as { post?: EditablePost };
      if (!response.ok || !result.post) {
        notify("The post could not be unpublished.", true);
        return;
      }
      status = result.post.status;
      version = result.post.version;
      notify("Unpublished. The post is no longer on the public site.");
    } catch {
      notify("Could not reach the server.", true);
    } finally {
      busy = "";
    }
  }

  async function showPreview() {
    mode = "preview";
    try {
      const response = await fetch("/api/preview", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ markdown: fields.bodyMarkdown }),
      });
      if (response.ok) previewHtml = ((await response.json()) as { html: string }).html;
    } catch {
      previewHtml = "<p>The preview could not be rendered.</p>";
    }
  }

  async function fetchMetadata() {
    notify("Fetching link details…");
    try {
      const response = await fetch("/api/link-metadata", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: fields.sourceUrl }),
      });
      const result = (await response.json()) as {
        error?: string;
        url?: string;
        title?: string;
        description?: string;
      };
      if (!response.ok) throw new Error(result.error ?? "The link details could not be fetched.");
      fields.sourceUrl = result.url ?? fields.sourceUrl;
      fields.sourceTitle = result.title ?? "";
      fields.sourceDescription = result.description ?? "";
      notify("");
    } catch (caught) {
      notify(
        caught instanceof Error ? caught.message : "The link details could not be fetched.",
        true,
      );
    }
  }

  async function uploadImages(files: FileList | File[]) {
    const images = Array.from(files).filter((file) => file.type.startsWith("image/"));
    if (!images.length) {
      notify("Drop or choose a JPEG, PNG, WebP, or GIF image.", true);
      return;
    }
    if (busy) return;
    busy = "uploading";
    try {
      // Images belong to a saved post, so a new post is saved as a draft first.
      const created = !postId;
      if (created && !(await persist()).ok) return;
      for (const image of images) {
        const data = new FormData();
        data.set("image", image);
        const response = await fetch(`/api/posts/${postId}/assets`, { method: "POST", body: data });
        const result = (await response.json()) as { markdown?: string; message?: string };
        if (!response.ok || !result.markdown) {
          throw new Error(result.message ?? "Image upload failed.");
        }
        insertMarkdown(result.markdown);
      }
      notify("");
      if (created && (await persist()).ok) await openSavedPost(true);
    } catch (caught) {
      notify(caught instanceof Error ? caught.message : "Image upload failed.", true);
    } finally {
      busy = "";
      if (fileInput) fileInput.value = "";
    }
  }

  function insertMarkdown(markdown: string) {
    const start = bodyInput?.selectionStart ?? fields.bodyMarkdown.length;
    const end = bodyInput?.selectionEnd ?? start;
    const before = fields.bodyMarkdown.slice(0, start);
    const after = fields.bodyMarkdown.slice(end);
    const prefix = before && !before.endsWith("\n") ? "\n\n" : "";
    const suffix = after && !after.startsWith("\n") ? "\n\n" : "";
    fields.bodyMarkdown = `${before}${prefix}${markdown}${suffix}${after}`;
    const cursor = before.length + prefix.length + markdown.length;
    requestAnimationFrame(() => {
      bodyInput?.focus();
      bodyInput?.setSelectionRange(cursor, cursor);
    });
  }

  function onKeydown(event: KeyboardEvent) {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
      event.preventDefault();
      void saveDraft();
    }
  }

  function pickFields(value: Fields): Fields {
    return {
      series: value.series,
      format: value.format,
      title: value.title ?? "",
      slug: value.slug ?? "",
      summary: value.summary ?? "",
      bodyMarkdown: value.bodyMarkdown ?? "",
      sourceUrl: value.sourceUrl ?? "",
      sourceTitle: value.sourceTitle ?? "",
      sourceDescription: value.sourceDescription ?? "",
      quoteText: value.quoteText ?? "",
      quoteAttribution: value.quoteAttribution ?? "",
      isListed: value.isListed ?? true,
    };
  }

  function snapshot(value: Fields): string {
    return JSON.stringify(pickFields(value));
  }
</script>

<svelte:window onkeydown={onKeydown} />

<svelte:head>
  <title>{fields.title.trim() || (postId ? "Untitled" : "Write")} · Aamir Azad</title>
</svelte:head>

<header class="site-nav !mb-10 !items-start md:min-h-10">
  <EditorBreadcrumbs
    label={postId ? "Posts" : "Create"}
    href={postId ? "/admin/posts" : "/admin/create"}
    accent={postId ? "blue" : "amber"}
  />
  <div
    class="flex items-center justify-between gap-3 max-sm:w-full max-sm:flex-wrap max-sm:justify-start"
  >
    <span
      class="min-w-16 text-right text-[0.8rem] text-soft max-sm:order-3 max-sm:w-full max-sm:text-left"
      aria-live="polite"
    >
      {#if busy === "saving"}Saving…{:else if busy === "publishing"}Publishing…{:else if unsaved}Unsaved
        · kept in this browser{:else if isPublished && liveIsStale}Saved · not yet published{:else if isPublished}Published{:else if postId}Draft
        saved{/if}
    </span>
    <button
      class="secondary-button"
      type="button"
      onclick={saveDraft}
      disabled={Boolean(busy)}
      title="Save draft (Ctrl+S)">Save draft</button
    >
    <button class="primary-button" type="button" onclick={publish} disabled={Boolean(busy)}>
      {isPublished ? "Publish changes" : "Publish"}
    </button>
  </div>
</header>

<header class="mt-2 mb-8 flex flex-wrap items-end justify-between gap-4">
  <h1
    class="admin-heading m-0 text-[clamp(2rem,5vw,3.2rem)]"
    data-accent={postId ? "blue" : "amber"}
  >
    {postId ? "Edit post" : "What do you want to say?"}
  </h1>
  {#if isPublished && canonicalPath}
    <p class="m-0 flex items-center gap-4 text-sm">
      <a class="text-muted" href={canonicalPath} target="_blank">View post ↗</a>
      <button class="button-link text-sm" type="button" onclick={unpublish} disabled={Boolean(busy)}
        >Unpublish</button
      >
    </p>
  {/if}
</header>

{#if restored}
  <p
    class="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#121a13] px-4 py-3 text-[#c8dcc9]"
    role="status"
  >
    Restored unsaved changes from this browser.
    <button class="button-link text-sm" type="button" onclick={discardLocalCopy}
      >Discard them</button
    >
  </p>
{/if}
{#if message}
  <p
    class:bg-[#211310]={isError}
    class:text-[#ffb4a9]={isError}
    class="mb-6 rounded-xl bg-[#121a13] px-4 py-3 text-[#c8dcc9]"
    role={isError ? "alert" : "status"}
  >
    {message}
    {#if !isError && isPublished && canonicalPath && message === "Published."}
      <a class="ml-2" href={canonicalPath}>View post →</a>
    {/if}
  </p>
{/if}
{#if issues.length}
  <ul
    class="mb-6 rounded-xl bg-[#211310] px-4 py-3 pl-8 text-[#ffb4a9]"
    aria-label="Publishing issues"
    role="alert"
  >
    {#each issues as issue}<li>{issue.message}</li>{/each}
  </ul>
{/if}

<form class="grid gap-[1.35rem]" onsubmit={(event) => event.preventDefault()}>
  <SeriesPicker bind:value={fields.series} />
  <label>
    <span class="mb-2 p-0 text-xs font-[650] tracking-[0.12em] text-soft uppercase">Title</span>
    <span
      class="admin-card flex items-baseline px-4 font-serif text-[clamp(1.65rem,5vw,2.5rem)] text-text"
      ><input
        class="min-h-16 min-w-0 !border-0 !bg-transparent px-[0.15em] !shadow-none [font:inherit]"
        aria-label="Post title"
        maxlength="180"
        bind:value={fields.title}
        bind:this={titleInput}
        placeholder={`${titlePrefix(fields.series)}your subject`}
      /></span
    >
  </label>

  <div>
    <div class="mb-2 flex items-center justify-between gap-3">
      <span class="text-xs font-[650] tracking-[0.12em] text-soft uppercase">Markdown</span>
      <div class="flex gap-1 rounded-full bg-surface p-1 text-sm" role="tablist">
        <button
          class="cursor-pointer rounded-full border-0 bg-transparent px-3 py-1 text-soft aria-selected:bg-[#242424] aria-selected:text-text"
          type="button"
          role="tab"
          aria-selected={mode === "write"}
          onclick={() => (mode = "write")}>Write</button
        >
        <button
          class="cursor-pointer rounded-full border-0 bg-transparent px-3 py-1 text-soft aria-selected:bg-[#242424] aria-selected:text-text"
          type="button"
          role="tab"
          aria-selected={mode === "preview"}
          onclick={showPreview}>Preview</button
        >
      </div>
    </div>
    {#if mode === "write"}
      <textarea
        class:ring-1={draggingImage}
        class:ring-text={draggingImage}
        class:bg-[#181818]={draggingImage}
        class:bg-surface={!draggingImage}
        class="min-h-[45vh] w-full !border-0 p-5 text-base !shadow-none"
        aria-label="Markdown"
        rows="18"
        maxlength="250000"
        spellcheck="true"
        bind:value={fields.bodyMarkdown}
        bind:this={bodyInput}
        placeholder="Start writing…"
        ondragenter={(event) => {
          if (event.dataTransfer?.types.includes("Files")) draggingImage = true;
        }}
        ondragover={(event) => event.preventDefault()}
        ondragleave={() => (draggingImage = false)}
        ondrop={(event) => {
          event.preventDefault();
          draggingImage = false;
          if (event.dataTransfer?.files.length) void uploadImages(event.dataTransfer.files);
        }}></textarea>
    {:else}
      <article class="admin-card min-h-[45vh] p-6">
        <h1 class="font-serif text-[clamp(2rem,5vw,3rem)]">{fields.title || "Untitled"}</h1>
        {#if fields.summary}<p class="text-[1.1rem] text-muted">{fields.summary}</p>{/if}
        {#if fields.format === "link" && fields.sourceUrl}<p>
            <a href={fields.sourceUrl}>{fields.sourceTitle || fields.sourceUrl} ↗</a>
          </p>{/if}
        {#if fields.format === "quote" && fields.quoteText}<blockquote>
            <p>{fields.quoteText}</p>
            {#if fields.quoteAttribution}<footer>— {fields.quoteAttribution}</footer>{/if}
          </blockquote>{/if}
        <RenderedMarkdown html={previewHtml} />
      </article>
    {/if}
  </div>
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
      disabled={Boolean(busy)}
      onclick={() => fileInput.click()}
      >{busy === "uploading" ? "Uploading image…" : "＋ Add image"}</button
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
            class:bg-[#292929]={fields.format === choice}
            class:text-text={fields.format === choice}
            class:text-muted={fields.format !== choice}
          >
            <input
              class="absolute min-h-px w-px opacity-0"
              type="radio"
              name="format"
              bind:group={fields.format}
              value={choice}
            />
            <span>{choice}</span>
          </label>
        {/each}
      </div>
    </fieldset>
    {#if fields.format === "link"}
      <label
        >Destination URL<input type="url" maxlength="2048" bind:value={fields.sourceUrl} /></label
      >
      <button class="secondary-button justify-self-start" type="button" onclick={fetchMetadata}
        >Fetch title and description</button
      >
      <label>Source title<input maxlength="500" bind:value={fields.sourceTitle} /></label>
      <label
        >Source description<textarea rows="3" maxlength="2000" bind:value={fields.sourceDescription}
        ></textarea></label
      >
    {/if}
    {#if fields.format === "quote"}
      <label
        >Quoted text<textarea rows="5" maxlength="10000" bind:value={fields.quoteText}
        ></textarea></label
      >
      <label>Attribution<input maxlength="500" bind:value={fields.quoteAttribution} /></label>
    {/if}
    <label>Summary<textarea rows="3" maxlength="500" bind:value={fields.summary}></textarea></label>
    <label
      >Slug<input
        maxlength="96"
        bind:value={fields.slug}
        placeholder={slugify(fields.title) || "generated-from-title"}
      /></label
    >
    <label class="flex items-start gap-3 rounded-lg bg-[#181818] p-3">
      <input
        class="mt-0.5 size-4 min-h-0 w-4 shrink-0 p-0"
        type="checkbox"
        bind:checked={fields.isListed}
      />
      <span>
        <strong class="block text-sm text-text">Show in public lists</strong>
        <small class="text-soft">
          Turn this off for an unlisted post that is only discoverable by its direct link.
        </small>
      </span>
    </label>
  </details>
</form>
