<script lang="ts">
  import { page } from "$app/state";
  import "@fontsource-variable/inter/wght.css";
  import "@fontsource-variable/inter/wght-italic.css";
  import "@fontsource-variable/noto-serif/wght.css";
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
  <a
    class="fixed top-[0.65rem] right-[0.65rem] z-30 grid size-11 place-items-center rounded-full border border-transparent text-[1.1rem] text-soft opacity-28 no-underline hover:border-border hover:bg-surface hover:opacity-100 focus-visible:border-border focus-visible:bg-surface focus-visible:opacity-100"
    href="/admin"
    aria-label="Open the publishing editor"
    data-sveltekit-reload
  >
    <span aria-hidden="true">✎</span>
  </a>
{/if}

{@render children()}

<style lang="postcss">
  @reference "../app.css";

  :global(.shell) {
    @apply mx-auto w-[min(calc(100%-2.5rem),760px)] py-[4.5rem] pb-24 max-sm:w-[min(calc(100%-2rem),760px)] max-sm:py-12 max-sm:pb-[4.5rem];
  }

  :global(.site-nav) {
    @apply mb-16 flex flex-wrap items-baseline justify-between gap-4 max-sm:mb-12;
  }

  :global(.site-nav > a) {
    @apply font-[650] no-underline;
  }

  :global(.site-nav ul) {
    @apply m-0 flex list-none flex-wrap gap-[0.85rem] p-0 text-sm text-soft;
  }

  :global(.eyebrow) {
    @apply mb-[0.35rem] text-xs tracking-[0.16em] text-soft uppercase;
  }
</style>
