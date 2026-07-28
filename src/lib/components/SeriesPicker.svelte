<script lang="ts">
  import { SERIES, type Series } from "$lib/content";

  let { value = $bindable(), legend = "Series" }: { value: Series; legend?: string } = $props();

  const labels: Record<Series, string> = {
    on: "On",
    today: "Today",
    built: "Built",
    found: "Found",
  };
</script>

<fieldset class="!border-0 !bg-transparent !p-0">
  <legend class="mb-2 p-0 text-xs font-[650] tracking-[0.12em] text-soft uppercase">
    {legend}
  </legend>
  <div class="grid grid-cols-4 gap-1 rounded-xl bg-surface p-1 max-sm:grid-cols-2">
    {#each SERIES as series}
      <label
        class="series-choice relative flex min-h-10 cursor-pointer grid-cols-none flex-row items-center justify-center gap-2 rounded-full border-0 bg-transparent px-3 transition-[background-color,box-shadow,color] duration-160 has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-focus"
        class:text-text={value === series}
        class:text-muted={value !== series}
        data-series={series}
        data-selected={value === series}
      >
        <input
          class="absolute min-h-px w-px opacity-0"
          type="radio"
          name="series"
          bind:group={value}
          value={series}
        />
        <span class="series-dot size-1.5 rounded-full bg-current" aria-hidden="true"></span>
        <span>{labels[series]}</span>
      </label>
    {/each}
  </div>
</fieldset>

<style lang="postcss">
  @reference "../../app.css";

  .series-choice[data-selected="true"] {
    @apply bg-[#242424] font-[650] shadow-[inset_0_0_0_1px_rgb(255_255_255_/_24%)];
  }

  .series-choice[data-series="on"] .series-dot {
    @apply text-blue;
  }

  .series-choice[data-series="today"] .series-dot {
    @apply text-mint;
  }

  .series-choice[data-series="built"] .series-dot {
    @apply text-amber;
  }

  .series-choice[data-series="found"] .series-dot {
    @apply text-violet;
  }
</style>
