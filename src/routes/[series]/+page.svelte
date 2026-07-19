<script lang="ts">
  import { SITE_ORIGIN } from "$lib/site";
  let { data } = $props();
</script>

<svelte:head
  ><title>{data.series} · Aamir Azad</title><meta
    name="description"
    content={`Published entries in ${data.series}.`}
  /><link rel="canonical" href={`${SITE_ORIGIN}/${data.series}`} /></svelte:head
>
<main class="shell">
  <nav class="site-nav"><a href="/">Aamir Azad</a><a href="/archive">Archive</a></nav>
  <header class="series-header">
    <p class="eyebrow">Series</p>
    <h1>{data.series}</h1>
  </header>
  {#if data.index.items.length}<ol class="published-list">
      {#each data.index.items as post}<li>
          <a href={post.canonicalPath}>{post.title}</a>
          <p>{post.summary}</p>
          <small>{post.format} · {new Date(post.publishedAt).toLocaleDateString()}</small>
        </li>{/each}
    </ol>{:else}<p>Nothing published here yet.</p>{/if}
  {#if data.index.totalPages > 1}<nav class="pagination">
      {#if data.index.page > 1}<a href={`?page=${data.index.page - 1}`}>Previous</a>{/if}<span
        >Page {data.index.page} of {data.index.totalPages}</span
      >{#if data.index.page < data.index.totalPages}<a href={`?page=${data.index.page + 1}`}>Next</a
        >{/if}
    </nav>{/if}
</main>
