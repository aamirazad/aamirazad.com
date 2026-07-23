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

<fieldset class="border-0 p-0">
  <legend class="mb-2 p-0 text-xs font-[650] tracking-[0.12em] text-soft uppercase">
    {legend}
  </legend>
  <div class="grid grid-cols-4 gap-[0.45rem] max-sm:grid-cols-2">
    {#each SERIES as series}
      <label
        class="relative grid min-h-11 cursor-pointer place-items-center rounded-[0.4rem] border border-border bg-surface has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-focus"
        class:border-text={value === series}
        class:bg-text={value === series}
        class:text-background={value === series}
        class:text-muted={value !== series}
      >
        <input
          class="absolute min-h-px w-px opacity-0"
          type="radio"
          name="series"
          bind:group={value}
          value={series}
        />
        <span>{labels[series]}</span>
      </label>
    {/each}
  </div>
</fieldset>
