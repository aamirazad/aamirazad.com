<script lang="ts">
  import { page } from "$app/state";
  import "../app.css";

  let { children } = $props();
</script>

<svelte:head>
  <meta name="robots" content="index, follow" />
  <meta name="theme-color" content="#0b0b0b" />
  <meta name="color-scheme" content="dark" />
  <link rel="icon" href="/favicon.svg" />
</svelte:head>

{#if !page.url.pathname.startsWith("/admin")}
  <a class="public-admin-entry" href="/admin" aria-label="Open the publishing editor">
    <span aria-hidden="true">✎</span>
  </a>
{/if}

{@render children()}
