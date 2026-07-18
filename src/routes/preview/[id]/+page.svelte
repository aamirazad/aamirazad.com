<script lang="ts">
  let { data } = $props();
</script>

<svelte:head
  ><title>Preview: {data.post.title || "Untitled"}</title><meta
    name="robots"
    content="noindex, nofollow"
  /></svelte:head
>
<main class="shell post-preview">
  <nav class="site-nav">
    <a href={`/admin/posts/${data.post.id}`}>← Back to editor</a><span class="preview-badge"
      >Private preview</span
    >
  </nav>
  <article>
    <p class="eyebrow">{data.post.series} · {data.post.format}</p>
    <h1>{data.post.title || "Untitled"}</h1>
    {#if data.post.summary}<p class="post-summary">{data.post.summary}</p>{/if}
    {#if data.post.format === "link" && data.post.sourceUrl}<p>
        <a href={data.post.sourceUrl}>{data.post.sourceTitle || data.post.sourceUrl} ↗</a>
      </p>{/if}
    {#if data.post.format === "quote"}<blockquote>
        <p>{data.post.quoteText}</p>
        <footer>— {data.post.quoteAttribution}</footer>
      </blockquote>{/if}
    {#if data.assets.length}<div class="preview-gallery">
        {#each data.assets as asset}<figure>
            <img
              src={`/api/assets/${asset.id}`}
              alt={asset.altText}
            />{#if asset.caption}<figcaption>{asset.caption}</figcaption>{/if}
          </figure>{/each}
      </div>{/if}
    <div class="rendered-markdown">{@html data.html}</div>
  </article>
</main>
