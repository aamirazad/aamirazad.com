<script lang="ts">
  let { children } = $props();
</script>

<div class="admin-surface">
  {@render children()}
</div>

<style lang="postcss">
  @reference "../../app.css";

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
