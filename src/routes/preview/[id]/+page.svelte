<script lang="ts">
  import RenderedMarkdown from "$lib/components/RenderedMarkdown.svelte";

  let { data } = $props();
</script>

<svelte:head
  ><title>Preview: {data.post.title || "Untitled"}</title><meta
    name="robots"
    content="noindex, nofollow"
  /></svelte:head
>
<main class="shell">
  <nav class="site-nav">
    <a href={`/admin/posts/${data.post.id}`}>← Back to editor</a>
  </nav>
  <article>
    <h1 class="text-[clamp(2rem,5vw,3rem)]">{data.post.title || "Untitled"}</h1>
    {#if data.post.summary}<p class="text-[1.1rem] text-muted">{data.post.summary}</p>{/if}
    {#if data.post.format === "link" && data.post.sourceUrl}<p>
        <a href={data.post.sourceUrl}>{data.post.sourceTitle || data.post.sourceUrl} ↗</a>
      </p>{/if}
    {#if data.post.format === "quote"}<blockquote>
        <p>{data.post.quoteText}</p>
        <footer>— {data.post.quoteAttribution}</footer>
      </blockquote>{/if}
    {#if data.assets.length}<div class="my-8 grid gap-6">
        {#each data.assets as asset}<figure>
            <img
              class="block h-auto max-h-112 w-full rounded-[0.35rem] bg-[#080808] object-contain"
              src={`/api/assets/${asset.id}`}
              alt={asset.altText}
            />{#if asset.caption}<figcaption>{asset.caption}</figcaption>{/if}
          </figure>{/each}
      </div>{/if}
    <RenderedMarkdown html={data.html} />
  </article>
</main>
