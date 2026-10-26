<script lang="ts">
  import PublishedDate from "$lib/components/PublishedDate.svelte";
  import { SERIES, type Series } from "$lib/content";
  import type { PublishedIndex } from "$lib/published";

  let {
    title,
    description,
    index,
    series,
  }: { title: string; description: string; index: PublishedIndex; series?: Series } = $props();
</script>

<header class="index-head">
  <h1 class="index-title">{title}</h1>
  <p class="index-lede">{description}</p>
  <nav aria-label="Series">
    <ul class="index-series">
      <li>
        <a class="pane" href="/archive" aria-current={series ? undefined : "page"}>All</a>
      </li>
      {#each SERIES as name}
        <li>
          <a
            class="pane"
            href={`/${name}`}
            data-series={name}
            aria-current={series === name ? "page" : undefined}
            ><span class="series-dot" aria-hidden="true"></span>{name}</a
          >
        </li>
      {/each}
    </ul>
  </nav>
</header>

<section aria-label="Posts">
  {#if index.items.length}
    <ol class="index-list">
      {#each index.items as post}
        <li>
          <a class="post-row glass" href={post.canonicalPath}>
            <span class="post-row-meta">
              {#if !series}
                <span class="post-row-series" data-series={post.series}
                  ><span class="series-dot" aria-hidden="true"></span>{post.series}</span
                ><span aria-hidden="true">·</span>
              {/if}
              <span class="capitalize">{post.format}</span><span aria-hidden="true">·</span>
              <PublishedDate
                publishedAt={post.publishedAt}
                modifiedAt={post.modifiedAt}
                showLabel={false}
              />
            </span>
            <span class="post-row-title">{post.title}</span>
            {#if post.summary}<span class="post-row-summary">{post.summary}</span>{/if}
          </a>
        </li>
      {/each}
    </ol>
  {:else}
    <p class="glass index-empty">
      {series ? "Nothing published here yet." : "Nothing published yet."}
    </p>
  {/if}
</section>

{#if index.totalPages > 1}
  <nav class="index-pages" aria-label="Pagination">
    {#if index.page > 1}
      <a class="glass index-page-link" href={`?page=${index.page - 1}`}>← Previous</a>
    {:else}<span></span>{/if}
    <span class="index-page-count">Page {index.page} of {index.totalPages}</span>
    {#if index.page < index.totalPages}
      <a class="glass index-page-link" href={`?page=${index.page + 1}`}>Next →</a>
    {:else}<span></span>{/if}
  </nav>
{/if}

<style lang="postcss">
  @reference "../../app.css";

  .index-head {
    @apply mb-8;
  }

  .index-title {
    @apply mb-3 font-serif font-normal text-[#fbf3ea] capitalize;
    font-size: clamp(2.75rem, 7vw, 4.75rem);
    line-height: 0.95;
    letter-spacing: -0.03em;
    text-shadow:
      0 2px 30px rgb(30 10 5 / 65%),
      0 0 80px rgb(255 140 70 / 18%);
  }

  .index-lede {
    @apply mb-6 max-w-[46ch] text-[1.08rem] text-[#efe3d8];
    text-shadow: 0 1px 18px rgb(0 0 0 / 75%);
  }

  .index-series {
    @apply m-0 flex list-none flex-wrap gap-2 p-0;
  }

  .index-series a {
    @apply inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[0.84rem] font-medium text-[#e4d9d0] capitalize no-underline backdrop-blur-md hover:text-text;
  }

  .index-series a[aria-current="page"] {
    @apply text-text;
    background: rgb(255 248 242 / 16%);
  }

  .index-list {
    @apply m-0 grid list-none gap-3 p-0;
  }

  .post-row {
    @apply grid gap-1 rounded-[16px] px-[clamp(1.1rem,3vw,1.75rem)] py-5 no-underline transition-colors duration-160;
  }

  .post-row:is(:hover, :focus-visible) {
    background: rgb(40 28 26 / 48%);
  }

  .post-row-meta {
    @apply flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.8rem] text-[#b9aca2];
  }

  .post-row-series {
    @apply inline-flex items-center gap-1.5 capitalize;
  }

  .post-row-title {
    @apply font-serif text-[1.25rem] leading-[1.3] font-semibold text-text;
  }

  .post-row-summary {
    @apply text-[0.95rem] leading-[1.55] text-[#d8ccc2];
  }

  .index-empty {
    @apply m-0 rounded-[16px] px-6 py-6 text-[#d8ccc2];
  }

  .series-dot {
    @apply size-1.5 shrink-0 rounded-full bg-current;
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

  .index-pages {
    @apply mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-4 text-[0.85rem];
  }

  .index-page-link {
    @apply justify-self-start rounded-full px-4 py-2 text-[#efe3d8] no-underline hover:text-text;
  }

  .index-page-link:last-child {
    @apply justify-self-end;
  }

  .index-page-count {
    @apply text-[#d8ccc2];
    text-shadow: 0 1px 12px rgb(0 0 0 / 70%);
  }
</style>
