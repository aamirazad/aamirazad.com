<script lang="ts">
  let { html }: { html: string } = $props();
</script>

<div class="rendered-markdown text-muted">{@html html}</div>

<style lang="postcss">
  @reference "../../app.css";

  .rendered-markdown :global(:is(h2, h3)) {
    @apply mt-8 tracking-normal text-text normal-case;
  }

  .rendered-markdown :global(h2) {
    @apply text-2xl;
  }

  .rendered-markdown :global(h3) {
    @apply text-[1.15rem];
  }

  .rendered-markdown :global(pre) {
    @apply overflow-x-auto rounded-[0.4rem] border border-border bg-[#090909] p-4;
  }

  .rendered-markdown :global(:not(pre) > code) {
    @apply rounded-[0.2rem] bg-[#202020] px-[0.3rem] py-[0.12rem];
  }
</style>
