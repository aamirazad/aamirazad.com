<script lang="ts">
  import { SITE_NAME, SITE_ORIGIN } from "$lib/site";
  let { data } = $props();
  // svelte-ignore state_referenced_locally -- public page data is immutable for this SSR-only route
  const post = data.post;
</script>

<svelte:head>
  <title>{post.title} · {SITE_NAME}</title><meta name="description" content={post.summary} /><link
    rel="canonical"
    href={`${SITE_ORIGIN}${post.canonicalPath}`}
  />
  <meta property="og:title" content={post.title} /><meta
    property="og:description"
    content={post.summary}
  /><meta property="og:type" content="article" /><meta
    property="og:url"
    content={`${SITE_ORIGIN}${post.canonicalPath}`}
  /><meta property="og:site_name" content={SITE_NAME} />
  <meta property="article:published_time" content={post.publishedAt} /><meta
    property="article:modified_time"
    content={post.modifiedAt}
  /><meta name="twitter:card" content="summary" />
</svelte:head>
<main class="shell post-page">
  <nav class="site-nav">
    <a href="/">Aamir Azad</a><a href={`/${post.series}`}>{post.series}</a>
  </nav>
  <article>
    <header>
      <p class="eyebrow">{post.series} · {post.format}</p>
      <h1>{post.title}</h1>
      {#if post.summary}<p class="post-summary">{post.summary}</p>{/if}<time
        datetime={post.publishedAt}>{new Date(post.publishedAt).toLocaleDateString()}</time
      >
    </header>
    {#if post.format === "link" && post.sourceUrl}<p class="source-card">
        <a href={post.sourceUrl} rel="noopener noreferrer">{post.sourceTitle || post.sourceUrl} ↗</a
        >{#if post.sourceDescription}<span>{post.sourceDescription}</span>{/if}
      </p>{/if}
    {#if post.format === "quote"}<blockquote class="featured-quote">
        <p>{post.quoteText}</p>
        {#if post.quoteAttribution}<footer>— {post.quoteAttribution}</footer>{/if}
      </blockquote>{/if}
    {#if post.assets.length}<div class="published-gallery">
        {#each post.assets as asset}{@const variants = asset.variants ?? []}
          {@const webp = variants.filter((variant) => variant.mimeType === "image/webp")}
          {@const fallback = variants.find((variant) => variant.name === "fallback")}
          <figure>
            <picture>
              {#if webp.length}<source
                  type="image/webp"
                  srcset={webp
                    .map(
                      (variant) =>
                        `/media/${asset.id}/${variant.contentHash}/${variant.name} ${variant.width}w`,
                    )
                    .join(", ")}
                  sizes="(max-width: 800px) calc(100vw - 2.5rem), 760px"
                />{/if}<img
                src={fallback
                  ? `/media/${asset.id}/${fallback.contentHash}/${fallback.name}`
                  : `/media/${asset.id}/original`}
                alt={asset.altText}
                width={fallback?.width ?? asset.width ?? undefined}
                height={fallback?.height ?? asset.height ?? undefined}
                loading="lazy"
                decoding="async"
              />
            </picture>{#if asset.caption}<figcaption>{asset.caption}</figcaption>{/if}
          </figure>{/each}
      </div>{/if}
    <div class="rendered-markdown">{@html post.html}</div>
  </article>
</main>
