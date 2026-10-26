<script lang="ts">
  import PublishedDate from "$lib/components/PublishedDate.svelte";
  import RenderedMarkdown from "$lib/components/RenderedMarkdown.svelte";
  import SiteBar from "$lib/components/SiteBar.svelte";
  import TwilightScene from "$lib/components/TwilightScene.svelte";
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
<TwilightScene variant="backdrop" />

<div class="page-shell">
  <SiteBar />
  <main>
    <article class="glass glass-reading post">
      <header class="post-head">
        <a class="post-series pane" href={`/${post.series}`} data-series={post.series}
          ><span class="series-dot" aria-hidden="true"></span>{post.series}</a
        >
        <h1 class="post-title">{post.title}</h1>
        {#if post.summary}<p class="post-summary">{post.summary}</p>{/if}
        <PublishedDate publishedAt={post.publishedAt} modifiedAt={post.modifiedAt} emphasized />
      </header>
      {#if post.format === "link" && post.sourceUrl}<p class="post-source pane">
          <a href={post.sourceUrl} rel="noopener noreferrer"
            >{post.sourceTitle || post.sourceUrl} ↗</a
          >{#if post.sourceDescription}<span class="text-sm text-[#b9aca2]"
              >{post.sourceDescription}</span
            >{/if}
        </p>{/if}
      {#if post.format === "quote"}<blockquote class="post-quote">
          <p>{post.quoteText}</p>
          {#if post.quoteAttribution}<footer>— {post.quoteAttribution}</footer>{/if}
        </blockquote>{/if}
      <RenderedMarkdown html={post.html} />
    </article>
    <nav class="post-after" aria-label="More writing">
      <a class="glass" href={`/${post.series}`}
        >← More in <span class="capitalize">{post.series}</span></a
      >
      <a class="glass" href="/archive">All writing</a>
    </nav>
  </main>
</div>

<style lang="postcss">
  @reference "../../../app.css";

  .post {
    @apply rounded-[18px] px-[clamp(1.25rem,5vw,3.5rem)] py-[clamp(1.75rem,5vw,3.25rem)];
  }

  .post-head {
    @apply mb-10;
  }

  .post-series {
    @apply mb-5 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[0.8rem] font-medium text-[#e4d9d0] capitalize no-underline hover:text-text;
  }

  .series-dot {
    @apply size-1.5 rounded-full bg-current;
  }

  [data-series="on"] .series-dot {
    @apply text-blue;
  }

  [data-series="today"] .series-dot {
    @apply text-mint;
  }

  [data-series="found"] .series-dot {
    @apply text-violet;
  }

  [data-series="built"] .series-dot {
    @apply text-amber;
  }

  .post-title {
    @apply mb-4 font-serif font-normal text-[#fbf3ea];
    font-size: clamp(2.2rem, 5.5vw, 3.4rem);
    line-height: 1.05;
    letter-spacing: -0.025em;
    text-wrap: balance;
  }

  .post-summary {
    @apply mb-4 text-[1.15rem] leading-[1.55] text-[#d8ccc2];
  }

  .post-source {
    @apply my-8 grid gap-[0.3rem] rounded-[12px] p-4;
  }

  .post-quote {
    @apply my-8 border-l-0 pl-0 font-serif text-[1.3rem] leading-[1.5] text-text;
  }

  .post-quote footer {
    @apply mt-2 font-sans text-[0.9rem] text-[#b9aca2];
  }

  .post-after {
    @apply mt-6 flex flex-wrap justify-between gap-3 text-[0.88rem];
  }

  .post-after a {
    @apply rounded-full px-4 py-2 text-[#efe3d8] no-underline hover:text-text;
  }
</style>
