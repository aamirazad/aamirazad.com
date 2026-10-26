<script lang="ts">
  import SiteBar from "$lib/components/SiteBar.svelte";
  import TwilightScene from "$lib/components/TwilightScene.svelte";
  import WritingIndex from "$lib/components/WritingIndex.svelte";
  import { SITE_ORIGIN } from "$lib/site";
  let { data } = $props();
</script>

<svelte:head
  ><title>{data.series}</title><meta
    name="description"
    content={`Published entries in ${data.series}.`}
  /><link rel="canonical" href={`${SITE_ORIGIN}/${data.series}`} /></svelte:head
>

<TwilightScene variant="backdrop" />

<div class="page-shell">
  <SiteBar current="archive" />
  <main>
    <WritingIndex
      title={data.series}
      description={`Everything published in “${data.series}”, newest first.`}
      index={data.index}
      series={data.series}
    />
  </main>
</div>
