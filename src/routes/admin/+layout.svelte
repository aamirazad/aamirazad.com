<script lang="ts">
  import { page } from "$app/state";

  let { children } = $props();

  const sections = [
    { href: "/admin/create", label: "Create", dot: "bg-amber" },
    { href: "/admin/posts", label: "Posts", dot: "bg-blue" },
    { href: "/admin/site", label: "Site", dot: "bg-violet" },
    { href: "/admin/redirects", label: "Redirects", dot: "bg-mint" },
  ] as const;

  const active = $derived(
    sections.find(
      (section) =>
        page.url.pathname === section.href || page.url.pathname.startsWith(`${section.href}/`),
    )?.href,
  );
</script>

<svelte:head>
  <meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="admin-surface">
  <main
    class="mx-auto grid w-[min(calc(100%-2.5rem),1180px)] grid-cols-[11.5rem_minmax(0,860px)] justify-center gap-[clamp(2.5rem,6vw,5rem)] py-8 pb-24 max-md:grid-cols-1 max-md:gap-7 max-sm:w-[min(calc(100%-2rem),1180px)]"
  >
    <aside
      class="admin-card sticky top-8 z-20 self-start p-2 max-md:top-2 max-md:-mx-1 max-md:bg-[color-mix(in_srgb,var(--color-surface)_94%,transparent)] max-md:p-1 max-md:backdrop-blur-xl"
      aria-label="Admin tools"
    >
      <nav class="grid gap-1 max-md:grid-cols-4">
        {#each sections as section}
          <a
            class="flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-soft no-underline transition-colors hover:text-text aria-current:bg-[#222] aria-current:text-text max-md:justify-center max-md:px-1 max-md:text-center"
            href={section.href}
            aria-current={active === section.href ? "page" : undefined}
            ><span class="size-1.5 shrink-0 rounded-full {section.dot}" aria-hidden="true"
            ></span>{section.label}</a
          >
        {/each}
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
      {@render children()}

      <form method="POST" action="/auth/logout" class="mt-12 hidden max-md:block">
        <button class="button-link" type="submit">Log out</button>
      </form>
    </section>
  </main>
</div>

<style lang="postcss">
  @reference "../../app.css";

  :global(html) {
    scrollbar-gutter: stable;
  }

  .admin-surface {
    @apply min-h-screen;
    background:
      radial-gradient(circle at 8% 2%, rgb(125 183 255 / 7%), transparent 25rem),
      radial-gradient(circle at 92% 14%, rgb(183 160 255 / 5%), transparent 26rem),
      var(--color-background);
  }

  :global(.button-link) {
    @apply inline-flex cursor-pointer items-center gap-1 rounded-full border-0 bg-transparent px-1 py-1 text-soft no-underline transition-colors duration-160 hover:text-text;
  }

  :global(.primary-button),
  :global(.secondary-button) {
    @apply inline-flex min-h-10 cursor-pointer items-center justify-center rounded-full border-0 px-4 py-[0.6rem] leading-tight font-[650] no-underline transition-all duration-160;
  }

  :global(.primary-button) {
    @apply bg-text text-background hover:bg-white hover:text-background;
  }

  :global(.secondary-button) {
    @apply bg-[#1a1a1a] text-muted hover:bg-[#222] hover:text-text;
  }

  :global(.admin-surface input:not([type="radio"]):not([type="checkbox"]):not([type="file"])),
  :global(.admin-surface select),
  :global(.admin-surface textarea) {
    @apply rounded-xl border border-transparent bg-surface shadow-[inset_0_0_0_1px_rgb(255_255_255_/_0.035)] transition-colors duration-160 hover:bg-[#151515] focus:border-[#3b3b3b] focus:bg-[#151515];
  }

  :global(.admin-surface input[type="file"]) {
    @apply rounded-xl border border-dashed border-[#343434] bg-surface px-3 py-3 text-sm text-soft file:mr-3 file:rounded-full file:border-0 file:bg-[#222] file:px-3 file:py-2 file:font-semibold file:text-muted;
  }

  :global(.admin-surface fieldset) {
    @apply rounded-xl border-0 bg-surface p-4;
  }

  :global(.admin-surface legend) {
    @apply px-0;
  }

  :global(.admin-heading) {
    @apply flex items-center gap-3 font-serif tracking-[-0.035em];
  }

  :global(.admin-heading::before) {
    @apply h-7 w-1 shrink-0 rounded-full bg-blue content-[''];
  }

  :global(.admin-heading[data-accent="mint"]::before) {
    @apply bg-mint;
  }

  :global(.admin-heading[data-accent="violet"]::before) {
    @apply bg-violet;
  }

  :global(.admin-heading[data-accent="amber"]::before) {
    @apply bg-amber;
  }

  :global(.admin-card) {
    @apply rounded-xl bg-surface;
  }

  :global(.admin-details) {
    @apply rounded-xl bg-surface px-4;
  }

  :global(.admin-details > summary) {
    @apply cursor-pointer list-none py-4 font-[650] text-muted;
  }

  :global(.admin-details > summary::-webkit-details-marker) {
    display: none;
  }

  :global(.admin-details > summary::after) {
    @apply float-right text-soft content-['+'];
  }

  :global(.admin-details[open] > summary::after) {
    content: "−";
  }
</style>
