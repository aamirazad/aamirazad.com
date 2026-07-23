<script lang="ts">
  let { children } = $props();
</script>

{@render children()}

<style lang="postcss">
  @reference "../../app.css";

  :global(.button-link) {
    @apply cursor-pointer border-0 bg-transparent p-0 text-soft underline underline-offset-[0.22em];
  }

  :global(.primary-button),
  :global(.secondary-button) {
    @apply inline-flex min-h-10 cursor-pointer items-center justify-center rounded-[0.35rem] px-[0.9rem] py-[0.55rem] leading-tight font-[650] no-underline;
  }

  :global(.primary-button) {
    @apply border border-text bg-text text-background;
  }

  :global(.secondary-button) {
    @apply border border-border bg-surface text-muted;
  }
</style>
