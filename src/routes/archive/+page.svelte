<script lang="ts">
  import PublishedDate from "$lib/components/PublishedDate.svelte";
  import { SITE_ORIGIN } from "$lib/site";
  let { data } = $props();
</script>

<svelte:head
  ><title>Archive · Aamir Azad</title><meta
    name="description"
    content="Everything published by Aamir Azad."
  /><link rel="canonical" href={`${SITE_ORIGIN}/archive`} /></svelte:head
>
<main class="shell">
  <nav class="site-nav"><a href="/">Aamir Azad</a></nav>
  <header class="mb-10">
    <p class="eyebrow">Everything</p>
    <h1>Archive</h1>
  </header>
  {#if data.index.items.length}<ol class="m-0 grid list-none gap-0 p-0">
      {#each data.index.items as post}<li class="border-b border-border py-[1.15rem] first:pt-0">
          <a class="text-[1.05rem] font-[650] text-text no-underline" href={post.canonicalPath}
            >{post.title}</a
          >
          <p class="mt-1 mb-0">{post.summary}</p>
          <small
            >{post.series} · {post.format} · <PublishedDate
              publishedAt={post.publishedAt}
              modifiedAt={post.modifiedAt}
            /></small
          >
        </li>{/each}
    </ol>{:else}<p>Nothing published yet.</p>{/if}
  {#if data.index.totalPages > 1}<nav
      class="mt-8 flex justify-between gap-4 text-[0.85rem] text-soft"
    >
      {#if data.index.page > 1}<a href={`?page=${data.index.page - 1}`}>Previous</a>{/if}<span
        >Page {data.index.page} of {data.index.totalPages}</span
      >{#if data.index.page < data.index.totalPages}<a href={`?page=${data.index.page + 1}`}>Next</a
        >{/if}
    </nav>{/if}
</main>
