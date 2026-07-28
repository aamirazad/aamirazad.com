<script lang="ts">
  import { type SiteItem, type SiteItemInput, type SiteItemKind } from "$lib/site-content";

  let { initialItems }: { initialItems: SiteItem[] } = $props();
  // svelte-ignore state_referenced_locally -- server data intentionally seeds a mutable client list
  let items = $state([...initialItems]);
  let selectedKind = $state<SiteItemKind>("link");
  let creating = $state(false);
  let editingId = $state<string | null>(null);
  let busy = $state(false);
  let message = $state("");
  let isError = $state(false);
  let createDraft = $state<SiteItemInput>(emptyInput("link"));
  let editDraft = $state<(SiteItemInput & { version: number }) | null>(null);
  let visibleItems = $derived(items.filter((item) => item.kind === selectedKind));

  const sections: Array<{ kind: SiteItemKind; label: string; singular: string }> = [
    { kind: "link", label: "Links", singular: "link" },
    { kind: "project", label: "Projects", singular: "project" },
    { kind: "homelab", label: "Homelab", singular: "service" },
  ];
  let activeSection = $derived(sections.find((section) => section.kind === selectedKind)!);

  function selectKind(kind: SiteItemKind) {
    selectedKind = kind;
    creating = false;
    editingId = null;
    editDraft = null;
    message = "";
  }

  function startCreate() {
    editingId = null;
    editDraft = null;
    createDraft = emptyInput(selectedKind);
    creating = true;
    message = "";
  }

  function startEdit(item: SiteItem) {
    creating = false;
    editingId = item.id;
    editDraft = {
      kind: item.kind,
      name: item.name,
      description: item.description,
      href: item.href,
      github: item.github,
      codeUrl: item.codeUrl,
      badge: item.badge,
      isWip: item.isWip,
      version: item.version,
    };
    message = "";
  }

  async function createItem(event: SubmitEvent) {
    event.preventDefault();
    busy = true;
    message = "";
    isError = false;
    try {
      const response = await fetch("/api/site-items", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(createDraft),
      });
      const result = (await response.json().catch(() => ({}))) as {
        item?: SiteItem;
        message?: string;
      };
      if (!response.ok || !result.item)
        throw new Error(result.message ?? `The ${activeSection.singular} could not be added.`);
      items = [...items, result.item];
      creating = false;
      message = `${capitalize(activeSection.singular)} added.`;
    } catch (caught) {
      isError = true;
      message =
        caught instanceof Error
          ? caught.message
          : `The ${activeSection.singular} could not be added.`;
    } finally {
      busy = false;
    }
  }

  async function saveItem(event: SubmitEvent, id: string) {
    event.preventDefault();
    if (!editDraft) return;
    busy = true;
    message = "";
    isError = false;
    try {
      const response = await fetch(`/api/site-items/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(editDraft),
      });
      const result = (await response.json().catch(() => ({}))) as {
        item?: SiteItem;
        message?: string;
      };
      if (!response.ok || !result.item)
        throw new Error(result.message ?? "The changes could not be saved.");
      items = items.map((item) => (item.id === id ? result.item! : item));
      editingId = null;
      editDraft = null;
      message = "Changes saved.";
    } catch (caught) {
      isError = true;
      message = caught instanceof Error ? caught.message : "The changes could not be saved.";
    } finally {
      busy = false;
    }
  }

  async function removeItem(item: SiteItem) {
    if (!confirm(`Delete “${item.name}”?`)) return;
    busy = true;
    message = "";
    isError = false;
    try {
      const response = await fetch(`/api/site-items/${item.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error(`The ${activeSection.singular} could not be deleted.`);
      items = items.filter((candidate) => candidate.id !== item.id);
      if (editingId === item.id) {
        editingId = null;
        editDraft = null;
      }
      message = `${capitalize(activeSection.singular)} deleted.`;
    } catch (caught) {
      isError = true;
      message =
        caught instanceof Error
          ? caught.message
          : `The ${activeSection.singular} could not be deleted.`;
    } finally {
      busy = false;
    }
  }

  function emptyInput(kind: SiteItemKind): SiteItemInput {
    return {
      kind,
      name: "",
      description: "",
      href: "",
      github: "",
      codeUrl: "",
      badge: "",
      isWip: false,
    };
  }

  function capitalize(value: string): string {
    return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
  }
</script>

<svelte:head>
  <title>Manage site content · Aamir Azad</title>
</svelte:head>

<header class="mt-2 mb-8">
  <h1 class="admin-heading m-0 text-[clamp(2rem,5vw,3.2rem)]" data-accent="violet">Manage site</h1>
</header>

<div
  class="mb-8 flex w-fit gap-1 rounded-full bg-surface p-1"
  role="tablist"
  aria-label="Content section"
>
  {#each sections as section}
    <button
      class="cursor-pointer rounded-full border-0 bg-transparent px-3 py-1.5 text-sm font-semibold text-soft transition-colors hover:text-text aria-selected:bg-[#222] aria-selected:text-text"
      type="button"
      role="tab"
      aria-selected={selectedKind === section.kind}
      onclick={() => selectKind(section.kind)}>{section.label}</button
    >
  {/each}
</div>

<div class="mb-6 flex items-baseline justify-between gap-4">
  <p class="m-0 text-sm text-soft">
    {visibleItems.length}
    {visibleItems.length === 1 ? activeSection.singular : `${activeSection.singular}s`}
  </p>
  <button class="secondary-button" type="button" onclick={startCreate}>
    <span class="mr-1 text-violet" aria-hidden="true">＋</span>Add {activeSection.singular}
  </button>
</div>

{#if message}
  <p
    class:text-[#ffb4a9]={isError}
    class="mb-6 rounded-xl bg-surface px-4 py-3 text-sm"
    role={isError ? "alert" : "status"}
  >
    {message}
  </p>
{/if}

{#if creating}
  <form class="admin-card mb-8 grid gap-4 p-5" onsubmit={createItem}>
    <h2 class="m-0 font-serif text-[1.3rem] tracking-normal text-text normal-case">
      New {activeSection.singular}
    </h2>
    {@render itemFields(createDraft, selectedKind)}
    <div class="flex gap-3">
      <button class="primary-button" type="submit" disabled={busy}>Add</button>
      <button class="button-link" type="button" onclick={() => (creating = false)}>Cancel</button>
    </div>
  </form>
{/if}

{#if visibleItems.length === 0 && !creating}
  <p class="admin-card px-5 py-7">No {activeSection.singular}s yet.</p>
{:else}
  <ol
    class:grid-cols-2={selectedKind !== "project"}
    class="m-0 grid list-none gap-3 p-0 max-sm:grid-cols-1"
  >
    {#each visibleItems as item}
      <li class="admin-card p-5 transition-colors duration-160 hover:bg-[#151515]">
        {#if editingId === item.id && editDraft}
          <form class="grid gap-4" onsubmit={(event) => saveItem(event, item.id)}>
            {@render itemFields(editDraft, item.kind)}
            <div class="flex gap-3">
              <button class="primary-button" type="submit" disabled={busy}>Save changes</button>
              <button
                class="button-link"
                type="button"
                onclick={() => {
                  editingId = null;
                  editDraft = null;
                }}>Cancel</button
              >
            </div>
          </form>
        {:else}
          <div class="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-5 max-sm:grid-cols-1">
            <div class="min-w-0">
              <strong class="font-serif text-[1.1rem]">{item.name}</strong>
              {#if item.description}<p class="mt-1 mb-0 text-sm">{item.description}</p>{/if}
              {#if item.href}<small class="mt-1 block truncate">{item.href}</small>{/if}
              {#if item.kind === "project"}
                <small class="mt-1 block">
                  {[
                    item.github && `GitHub: ${item.github}`,
                    item.codeUrl && "Code link",
                    item.badge,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </small>
              {/if}
            </div>
            <div class="flex items-center gap-4">
              <button class="button-link text-sm" type="button" onclick={() => startEdit(item)}
                >Edit</button
              >
              <button
                class="button-link text-sm text-[#e9a39a]"
                type="button"
                disabled={busy}
                onclick={() => removeItem(item)}>Delete</button
              >
            </div>
          </div>
        {/if}
      </li>
    {/each}
  </ol>
{/if}

{#snippet itemFields(draft: SiteItemInput, kind: SiteItemKind)}
  <label>
    {kind === "link" ? "Label" : "Name"}
    <input maxlength="180" required bind:value={draft.name} />
  </label>
  <label>
    {kind === "link" ? "Destination" : "Website"}
    <input
      maxlength="2048"
      bind:value={draft.href}
      placeholder={kind === "link" ? "/path, mailto:, or https://" : "https://"}
    />
  </label>
  {#if kind === "project"}
    <label>
      Description
      <textarea rows="4" maxlength="2000" bind:value={draft.description}></textarea>
    </label>
    <div class="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
      <label>
        GitHub repository
        <input maxlength="500" bind:value={draft.github} placeholder="owner/repository" />
      </label>
      <label>
        Code URL
        <input maxlength="2048" bind:value={draft.codeUrl} placeholder="https://" />
      </label>
    </div>
    <div class="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 max-sm:grid-cols-1">
      <label>
        Badge
        <input maxlength="80" bind:value={draft.badge} placeholder="Featured" />
      </label>
      <label class="flex min-h-11 cursor-pointer grid-cols-[auto_1fr] items-center gap-2 pb-2">
        <input class="size-4 min-h-0 w-4 p-0" type="checkbox" bind:checked={draft.isWip} />
        Work in progress
      </label>
    </div>
  {/if}
{/snippet}
