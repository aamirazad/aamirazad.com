<script lang="ts">
  import type { RedirectLink, RedirectLinkInput } from "$lib/redirect-links";

  let { initialLinks }: { initialLinks: RedirectLink[] } = $props();
  // svelte-ignore state_referenced_locally -- server data intentionally seeds a mutable client list
  let links = $state([...initialLinks]);
  let creating = $state(false);
  let editingId = $state<string | null>(null);
  let busy = $state(false);
  let message = $state("");
  let isError = $state(false);
  let createDraft = $state<RedirectLinkInput>(emptyInput());
  let editDraft = $state<(RedirectLinkInput & { version: number }) | null>(null);

  function startCreate() {
    creating = true;
    editingId = null;
    editDraft = null;
    createDraft = emptyInput();
    message = "";
  }

  function startEdit(link: RedirectLink) {
    creating = false;
    editingId = link.id;
    editDraft = {
      path: link.path,
      targetUrl: link.targetUrl,
      label: link.label,
      version: link.version,
    };
    message = "";
  }

  async function createLink(event: SubmitEvent) {
    event.preventDefault();
    busy = true;
    message = "";
    isError = false;
    try {
      const response = await fetch("/api/redirect-links", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(createDraft),
      });
      const result = (await response.json().catch(() => ({}))) as {
        link?: RedirectLink;
        message?: string;
      };
      if (!response.ok || !result.link)
        throw new Error(result.message ?? "The redirect could not be added.");
      links = [result.link, ...links];
      creating = false;
      message = "Redirect added.";
    } catch (caught) {
      isError = true;
      message = caught instanceof Error ? caught.message : "The redirect could not be added.";
    } finally {
      busy = false;
    }
  }

  async function saveLink(event: SubmitEvent, id: string) {
    event.preventDefault();
    if (!editDraft) return;
    busy = true;
    message = "";
    isError = false;
    try {
      const response = await fetch(`/api/redirect-links/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(editDraft),
      });
      const result = (await response.json().catch(() => ({}))) as {
        link?: RedirectLink;
        message?: string;
      };
      if (!response.ok || !result.link)
        throw new Error(result.message ?? "The redirect could not be saved.");
      links = links.map((link) => (link.id === id ? result.link! : link));
      editingId = null;
      editDraft = null;
      message = "Changes saved.";
    } catch (caught) {
      isError = true;
      message = caught instanceof Error ? caught.message : "The redirect could not be saved.";
    } finally {
      busy = false;
    }
  }

  async function removeLink(link: RedirectLink) {
    if (!confirm(`Delete redirect “${link.path}”?`)) return;
    busy = true;
    message = "";
    isError = false;
    try {
      const response = await fetch(`/api/redirect-links/${link.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("The redirect could not be deleted.");
      links = links.filter((candidate) => candidate.id !== link.id);
      message = "Redirect deleted.";
    } catch (caught) {
      isError = true;
      message = caught instanceof Error ? caught.message : "The redirect could not be deleted.";
    } finally {
      busy = false;
    }
  }

  function emptyInput(): RedirectLinkInput {
    return { path: "/", targetUrl: "", label: "" };
  }
</script>

<svelte:head>
  <title>Manage redirects · Aamir Azad</title>
</svelte:head>

<header class="mt-2 mb-8">
  <h1 class="admin-heading m-0 text-[clamp(2rem,5vw,3.2rem)]" data-accent="mint">Redirect links</h1>
  <p class="mt-3 mb-0 max-w-xl text-soft">
    Create a short public path, send visitors to its destination, and see the resulting clicks.
  </p>
</header>

<div class="mb-6 flex items-baseline justify-between gap-4">
  <p class="m-0 text-sm text-soft">
    {links.length}
    {links.length === 1 ? "redirect" : "redirects"}
  </p>
  <button class="secondary-button" type="button" onclick={startCreate}>
    <span class="mr-1 text-mint" aria-hidden="true">＋</span>Add redirect
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
  <form class="admin-card mb-8 grid gap-4 p-5" onsubmit={createLink}>
    <h2 class="m-0 font-serif text-[1.3rem] tracking-normal text-text normal-case">New redirect</h2>
    {@render redirectFields(createDraft)}
    <div class="flex gap-3">
      <button class="primary-button" type="submit" disabled={busy}>Add</button>
      <button class="button-link" type="button" onclick={() => (creating = false)}>Cancel</button>
    </div>
  </form>
{/if}

{#if links.length === 0 && !creating}
  <p class="admin-card px-5 py-7">No redirects yet.</p>
{:else}
  <ol class="m-0 grid list-none gap-3 p-0">
    {#each links as link}
      <li class="admin-card p-5 transition-colors duration-160 hover:bg-[#151515]">
        {#if editingId === link.id && editDraft}
          <form class="grid gap-4" onsubmit={(event) => saveLink(event, link.id)}>
            {@render redirectFields(editDraft)}
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
              <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <a
                  class="font-serif text-[1.15rem] text-text"
                  href={link.path}
                  target="_blank"
                  rel="noreferrer">{link.path}</a
                >
                {#if link.label}<span class="text-sm text-soft">{link.label}</span>{/if}
              </div>
              <small class="mt-1 block truncate">{link.targetUrl}</small>
              <dl class="mt-4 flex gap-6 text-sm">
                <div>
                  <dt class="text-soft">All time</dt>
                  <dd class="m-0 font-semibold text-text">{link.allTimeClicks}</dd>
                </div>
                <div>
                  <dt class="text-soft">Last 24 hours</dt>
                  <dd class="m-0 font-semibold text-text">{link.last24HoursClicks}</dd>
                </div>
              </dl>
            </div>
            <div class="flex items-center gap-4">
              <button class="button-link text-sm" type="button" onclick={() => startEdit(link)}
                >Edit</button
              >
              <button
                class="button-link text-sm text-[#e9a39a]"
                type="button"
                disabled={busy}
                onclick={() => removeLink(link)}>Delete</button
              >
            </div>
          </div>
        {/if}
      </li>
    {/each}
  </ol>
{/if}

{#snippet redirectFields(draft: RedirectLinkInput)}
  <label
    >Short path<input maxlength="180" bind:value={draft.path} placeholder="/newsletter" /></label
  >
  <label
    >Destination URL<input
      type="url"
      maxlength="2048"
      bind:value={draft.targetUrl}
      placeholder="https://example.com"
    /></label
  >
  <label
    >Label <small class="text-soft">optional, for your dashboard</small><input
      maxlength="180"
      bind:value={draft.label}
      placeholder="Newsletter signup"
    /></label
  >
{/snippet}
