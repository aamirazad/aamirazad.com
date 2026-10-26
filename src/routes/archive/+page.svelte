<script lang="ts">
  import SiteBar from "$lib/components/SiteBar.svelte";
  import TwilightScene from "$lib/components/TwilightScene.svelte";
  import WritingIndex from "$lib/components/WritingIndex.svelte";
  import { SITE_ORIGIN } from "$lib/site";
  let { data } = $props();
</script>

<svelte:head
  ><title>Archive · Aamir Azad</title><meta
    name="description"
    content="Everything published by Aamir Azad."
  /><link rel="canonical" href={`${SITE_ORIGIN}/archive`} /></svelte:head
>

<TwilightScene variant="backdrop" />

<div class="page-shell">
  <SiteBar current="archive" />
  <main>
    <WritingIndex
      title="Writing"
      description="Everything I've published, newest first."
      index={data.index}
    />
  </main>
</div>
