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

<fieldset class="series-picker">
  <legend>{legend}</legend>
  <div class="choice-buttons">
    {#each SERIES as series}
      <label class:chosen={value === series}>
        <input type="radio" name="series" bind:group={value} value={series} />
        <span>{labels[series]}</span>
      </label>
    {/each}
  </div>
</fieldset>
