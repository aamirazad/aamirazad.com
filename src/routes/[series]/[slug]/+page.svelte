<script lang="ts">
  import PublishedDate from "$lib/components/PublishedDate.svelte";
  import RenderedMarkdown from "$lib/components/RenderedMarkdown.svelte";
  import { SITE_NAME, SITE_ORIGIN } from "$lib/site";
  let { data } = $props();
  // svelte-ignore state_referenced_locally -- public page data is immutable for this SSR-only route
  const post = data.post;
</script>

<svelte:head>
  <title>{post.title}</title><meta name="description" content={post.summary} /><link
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
  /><meta name="twitter:card" content="summary" />{#if post.isListed === false}<meta
      name="robots"
      content="noindex, nofollow"
    />{/if}
</svelte:head>
<main class="shell w-[min(calc(100%-2.5rem),780px)]">
  <nav class="site-nav">
    <a href="/">Aamir Azad</a><a href={`/${post.series}`}>{post.series}</a>
  </nav>
  <article>
    <header class="mb-10">
      <h1>{post.title}</h1>
      {#if post.summary}<p class="text-[1.1rem] text-muted">{post.summary}</p>{/if}
      <PublishedDate publishedAt={post.publishedAt} modifiedAt={post.modifiedAt} emphasized />
    </header>
    {#if post.format === "link" && post.sourceUrl}<p
        class="my-8 grid gap-[0.3rem] rounded-[0.45rem] border border-border bg-surface p-4"
      >
        <a href={post.sourceUrl} rel="noopener noreferrer">{post.sourceTitle || post.sourceUrl} ↗</a
        >{#if post.sourceDescription}<span class="text-sm text-soft">{post.sourceDescription}</span
          >{/if}
      </p>{/if}
    {#if post.format === "quote"}<blockquote class="my-8 text-[1.15rem]">
        <p>{post.quoteText}</p>
        {#if post.quoteAttribution}<footer>— {post.quoteAttribution}</footer>{/if}
      </blockquote>{/if}
    {#if post.assets.length}<div class="my-8 grid gap-6">
        {#each post.assets as asset}{@const variants = asset.variants ?? []}
          {@const webp = variants.filter((variant) => variant.mimeType === "image/webp")}
          {@const fallback = variants.find((variant) => variant.name === "fallback")}
          <figure class="m-0">
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
                class="block h-auto w-full rounded-[0.45rem] bg-surface"
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
    <RenderedMarkdown html={post.html} />
  </article>
</main>
