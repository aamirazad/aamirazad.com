<script lang="ts">
  import PublishedDate from "$lib/components/PublishedDate.svelte";
  import ProjectItem from "$lib/components/ProjectItem.svelte";
  import { SITE_DESCRIPTION, SITE_NAME, SITE_ORIGIN } from "$lib/site";

  let { data } = $props();

  // svelte-ignore state_referenced_locally -- page data is fixed for this public page instance
  const projects = data.siteItems.filter((item) => item.kind === "project");
  // svelte-ignore state_referenced_locally -- page data is fixed for this public page instance
  const contactLinks = data.siteItems.filter((item) => item.kind === "link");
  // svelte-ignore state_referenced_locally -- page data is fixed for this public page instance
  const homelab = data.siteItems.filter((item) => item.kind === "homelab");
  const visibleProjects = projects.slice(0, 3);
  const moreProjects = projects.slice(3);
  const visibleLinks = contactLinks.slice(0, 6);
  const moreLinks = contactLinks.slice(6);
  const publicHomelab = homelab.filter(
    (item) => item.href && item.name.toLocaleLowerCase() !== "forgejo",
  );
  const privateHomelab = homelab.filter(
    (item) => !item.href || item.name.toLocaleLowerCase() === "forgejo",
  );
  const visibleHomelab = publicHomelab.slice(0, 6);
  const moreHomelab = publicHomelab.slice(6);

  const writingTabs = [
    { id: "all", label: "All", description: "" },
    {
      id: "on",
      label: "On",
      description: "Notes and reflections on the things that have my attention.",
    },
    {
      id: "today",
      label: "Today",
      description: "A small record of what I’m doing, learning, and thinking today.",
    },
    {
      id: "found",
      label: "Found",
      description: "Interesting things I’ve found and want to keep close.",
    },
  ] as const;

  type WritingTab = (typeof writingTabs)[number]["id"];

  let activeWritingTab: WritingTab = $state("all");
  let activeWriting = $derived(writingTabs.find((tab) => tab.id === activeWritingTab)!);
  let visibleWriting = $derived(data.writing[activeWritingTab].slice(0, 3));

  function selectWritingTab(tab: WritingTab) {
    activeWritingTab = tab;
  }
</script>

<svelte:head>
  <title>{SITE_NAME}</title>
  <meta name="description" content={SITE_DESCRIPTION} />
  <link rel="canonical" href={`${SITE_ORIGIN}/`} />
  <meta property="og:title" content={SITE_NAME} />
  <meta property="og:description" content={SITE_DESCRIPTION} />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content={SITE_NAME} />
  <meta property="og:url" content={`${SITE_ORIGIN}/`} />
  <meta name="twitter:card" content="summary" />
</svelte:head>

<main class="shell home-shell relative">
  <nav class="absolute top-[1.15rem] right-16 flex gap-[0.45rem]" aria-label="Contact">
    <a
      class="grid size-8 place-items-center rounded-full text-muted no-underline hover:bg-surface hover:text-text focus-visible:bg-surface focus-visible:text-text"
      href="/github"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="GitHub"
    >
      <img class="size-4 opacity-84 invert" src="/icons/github.svg" alt="" />
    </a>
    <a
      class="grid size-8 place-items-center rounded-full text-muted no-underline hover:bg-surface hover:text-text focus-visible:bg-surface focus-visible:text-text"
      href="mailto:aamirmazad@gmail.com"
      aria-label="Email Aamir Azad"
    >
      <img class="size-4 opacity-84 invert" src="/icons/mail.svg" alt="" />
    </a>
  </nav>

  <header
    class="relative isolate mb-10 min-h-60 overflow-hidden py-[clamp(2rem,5vw,3.75rem)] max-sm:min-h-56 max-sm:px-[1.15rem] max-sm:py-8"
  >
    <h1
      class="relative z-0 mb-4 inline-block font-serif text-[clamp(3rem,8vw,5.75rem)] leading-[0.95] font-normal before:pointer-events-none before:absolute before:top-1/2 before:left-1/2 before:-z-1 before:h-[260%] before:w-[145%] before:-translate-x-1/2 before:-translate-y-1/2 before:-rotate-8 before:bg-[radial-gradient(ellipse_at_center,rgb(222_111_45_/_20%),transparent_70%)] before:content-[''] max-sm:text-[clamp(2.75rem,11vw,4rem)]"
    >
      {SITE_NAME}
    </h1>
    <p class="mb-0 max-w-[49ch] pb-[1em] text-[clamp(1rem,2vw,1.16rem)]">
      {SITE_DESCRIPTION}
    </p>
  </header>

  <section class="mt-0" id="writing" aria-labelledby="writing-heading">
    <h2
      class="section-title section-title-writing mb-5 font-serif text-[clamp(1.8rem,5vw,2.6rem)] tracking-[-0.03em] text-text normal-case"
      id="writing-heading"
    >
      Writing
    </h2>
    <div
      class="mb-6 flex w-fit flex-wrap gap-1 rounded-full bg-surface p-1"
      role="tablist"
      aria-label="Writing series"
    >
      {#each writingTabs as tab}
        <button
          class="cursor-pointer rounded-full border-0 bg-transparent px-3 py-1.5 text-sm text-soft transition-colors duration-160 hover:text-text focus-visible:text-text aria-selected:bg-[#202020] aria-selected:text-text"
          type="button"
          role="tab"
          id={`writing-tab-${tab.id}`}
          aria-selected={activeWritingTab === tab.id}
          aria-controls="writing-panel"
          onclick={() => selectWritingTab(tab.id)}>{tab.label}</button
        >
      {/each}
    </div>

    <div id="writing-panel" role="tabpanel" aria-labelledby={`writing-tab-${activeWritingTab}`}>
      {#if activeWriting.description}
        <p class="mb-[1.15rem] text-muted">{activeWriting.description}</p>
      {/if}

      {#if visibleWriting.length}
        <ol
          class="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(min(18rem,100%),1fr))] gap-3 p-0"
        >
          {#each visibleWriting as post}
            <li class="min-w-0">
              <article
                class="writing-card flex h-full min-h-48 flex-col rounded-xl bg-surface p-5 transition-colors duration-160"
                data-series={post.series}
              >
                <div class="mb-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                  <span class="writing-series inline-flex items-center gap-1.5 text-xs text-soft">
                    <span class="size-1.5 rounded-full bg-current" aria-hidden="true"></span>
                    {post.series}
                  </span>
                  <PublishedDate
                    publishedAt={post.publishedAt}
                    modifiedAt={post.modifiedAt}
                    showLabel={false}
                  />
                </div>
                <a
                  class="font-serif text-[clamp(1.12rem,2vw,1.35rem)] leading-[1.3] font-semibold text-text no-underline hover:underline"
                  href={post.canonicalPath}>{post.title}</a
                >
                {#if post.summary}
                  <p class="mt-2 mb-0 line-clamp-3 text-[0.9rem] leading-[1.55]">{post.summary}</p>
                {/if}
              </article>
            </li>
          {/each}
        </ol>
        {#if activeWritingTab === "all"}
          <a class="mt-5 inline-block text-[0.86rem] font-[650] text-muted" href="/archive"
            >Show all writing <span class="ml-[0.35rem] text-blue">→</span></a
          >
        {/if}
      {:else}
        <div class="flex min-h-24 items-center gap-[0.55rem] rounded-xl bg-surface px-5 py-5">
          <p class="m-0">No new posts</p>
        </div>
      {/if}
    </div>
  </section>

  <div class="mt-14 grid grid-cols-2 gap-x-[clamp(2.5rem,6vw,5rem)] gap-y-14 max-sm:grid-cols-1">
    <section class="col-span-full mt-0 max-sm:col-auto">
      <div class="mb-4">
        <h2
          class="section-title section-title-projects mt-[0.1rem] mb-0 font-serif text-[clamp(1.8rem,5vw,2.6rem)] tracking-[-0.03em] text-text normal-case"
        >
          Projects
        </h2>
      </div>
      <p class="max-w-[62ch] pb-[1em]">
        Things I build to learn, solve a problem, or see how far an idea can go.
      </p>
      <ul class="m-0 grid list-none grid-cols-3 gap-3 p-0 max-md:grid-cols-1">
        {#each visibleProjects as project}
          <li class="min-w-0"><ProjectItem {project} /></li>
        {/each}
      </ul>
      {#if moreProjects.length}
        <details class="section-expand">
          <summary>
            <span class="when-closed">Show {moreProjects.length} more projects</span>
            <span class="when-open">Show fewer projects</span>
          </summary>
          <ul class="m-0 grid list-none grid-cols-3 gap-3 p-0 pt-0 max-md:grid-cols-1">
            {#each moreProjects as project}
              <li class="min-w-0"><ProjectItem {project} /></li>
            {/each}
          </ul>
        </details>
      {/if}
    </section>

    <section class="mt-0">
      <div class="mb-4">
        <h2
          class="section-title section-title-links mt-[0.1rem] mb-0 font-serif text-[clamp(1.8rem,5vw,2.6rem)] tracking-[-0.03em] text-text normal-case"
        >
          Links
        </h2>
      </div>
      <p class="max-w-[62ch] pb-[1em]">Code, contact details, and a few other places to find me.</p>
      <ul class="m-0 grid list-none grid-cols-2 gap-2 p-0 max-sm:grid-cols-1">
        {#each visibleLinks as link}
          <li>
            <a
              class="group flex items-center justify-between gap-2 rounded-lg bg-surface px-3 py-2 text-[0.88rem] text-muted no-underline hover:text-text"
              href={link.href}
              rel="me"
              >{link.name}<span
                class="text-blue transition-transform duration-160 group-hover:translate-x-0.5"
                aria-hidden="true">→</span
              ></a
            >
          </li>
        {/each}
      </ul>
      {#if moreLinks.length}
        <details class="section-expand">
          <summary>
            <span class="when-closed">Show {moreLinks.length} more links</span>
            <span class="when-open">Show fewer links</span>
          </summary>
          <ul class="m-0 grid list-none grid-cols-2 gap-2 p-0 pt-0 max-sm:grid-cols-1">
            {#each moreLinks as link}
              <li>
                <a
                  class="group flex items-center justify-between gap-2 rounded-lg bg-surface px-3 py-2 text-[0.88rem] text-muted no-underline hover:text-text"
                  href={link.href}
                  rel="me"
                  >{link.name}<span
                    class="text-blue transition-transform duration-160 group-hover:translate-x-0.5"
                    aria-hidden="true">→</span
                  ></a
                >
              </li>
            {/each}
          </ul>
        </details>
      {/if}
    </section>

    <section class="mt-0">
      <div class="mb-4">
        <h2
          class="section-title section-title-homelab mt-[0.1rem] mb-0 font-serif text-[clamp(1.8rem,5vw,2.6rem)] tracking-[-0.03em] text-text normal-case"
        >
          Homelab
        </h2>
      </div>
      <p class="max-w-[62ch] pb-[1em]">The services and systems I run, maintain, and learn from.</p>

      <h3 class="mb-2 text-xs font-semibold tracking-[0.08em] text-soft uppercase">
        Public services
      </h3>
      <ul class="m-0 grid list-none grid-cols-2 gap-2 p-0">
        {#each visibleHomelab as item}
          <li>
            <a
              class="group flex items-center justify-between gap-2 rounded-lg bg-surface px-3 py-2 text-[0.84rem] text-muted no-underline hover:text-text"
              href={item.href}
              >{item.name}<span
                class="text-violet transition-transform duration-160 group-hover:-translate-y-px group-hover:translate-x-px"
                aria-hidden="true">↗</span
              ></a
            >
          </li>
        {/each}
      </ul>
      {#if moreHomelab.length}
        <details class="section-expand">
          <summary>
            <span class="when-closed">Show {moreHomelab.length} more services</span>
            <span class="when-open">Show fewer services</span>
          </summary>
          <ul class="m-0 grid list-none grid-cols-2 gap-2 p-0 pt-0">
            {#each moreHomelab as item}
              <li>
                <a
                  class="group flex items-center justify-between gap-2 rounded-lg bg-surface px-3 py-2 text-[0.84rem] text-muted no-underline hover:text-text"
                  href={item.href}
                  >{item.name}<span
                    class="text-violet transition-transform duration-160 group-hover:-translate-y-px group-hover:translate-x-px"
                    aria-hidden="true">↗</span
                  ></a
                >
              </li>
            {/each}
          </ul>
        </details>
      {/if}

      {#if privateHomelab.length}
        <div class="mt-5">
          <h3 class="mb-2 text-xs font-semibold tracking-[0.08em] text-soft uppercase">
            Private services
          </h3>
          <ul class="m-0 flex list-none flex-wrap gap-2 p-0">
            {#each privateHomelab as item}
              <li
                class="inline-flex items-center gap-1.5 rounded-full bg-[#101010] px-3 py-1.5 text-[0.78rem] text-soft"
              >
                <svg class="size-3 text-[#666]" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <rect x="3" y="7" width="10" height="7" rx="2" fill="currentColor" />
                  <path
                    d="M5.25 7V5a2.75 2.75 0 0 1 5.5 0v2"
                    stroke="currentColor"
                    stroke-width="1.5"
                  />
                </svg>
                {item.name}
              </li>
            {/each}
          </ul>
        </div>
      {/if}
    </section>
  </div>
</main>

<style lang="postcss">
  @reference "../app.css";

  .home-shell {
    width: min(calc(100% - 2.5rem), 1040px);
  }

  .section-title {
    @apply flex items-center gap-3;
  }

  .section-title::before {
    @apply h-7 w-1 rounded-full bg-current content-[''];
  }

  .section-title-writing::before {
    @apply text-amber;
  }

  .section-title-projects::before {
    @apply text-mint;
  }

  .section-title-links::before {
    @apply text-blue;
  }

  .section-title-homelab::before {
    @apply text-violet;
  }

  .writing-card:hover {
    background: #161616;
  }

  .writing-series {
    text-transform: capitalize;
  }

  .writing-card[data-series="on"] .writing-series {
    @apply text-blue;
  }

  .writing-card[data-series="today"] .writing-series {
    @apply text-mint;
  }

  .writing-card[data-series="found"] .writing-series {
    @apply text-violet;
  }

  .writing-card[data-series="built"] .writing-series {
    @apply text-amber;
  }

  .section-expand {
    @apply mt-4;
  }

  .section-expand::details-content {
    block-size: 0;
    overflow: hidden;
    opacity: 0;
    transition:
      block-size 260ms ease,
      content-visibility 260ms allow-discrete,
      opacity 180ms ease;
  }

  .section-expand[open]::details-content {
    block-size: auto;
    opacity: 1;
  }

  .section-expand[open] > summary {
    @apply mb-4;
  }

  .section-expand > summary {
    @apply inline-flex cursor-pointer list-none items-center gap-3 rounded-full bg-surface px-3 py-2 text-[0.8rem] font-[650] text-muted hover:text-text;
  }

  .section-expand > summary::-webkit-details-marker {
    display: none;
  }

  .section-expand > summary::after {
    @apply text-soft content-['+'];
  }

  .section-expand[open] > summary::after {
    content: "−";
  }

  .when-open {
    @apply hidden;
  }

  .section-expand[open] .when-open {
    @apply inline;
  }

  .section-expand[open] .when-closed {
    @apply hidden;
  }

  @media (max-width: 40rem) {
    .home-shell {
      width: min(calc(100% - 2rem), 1040px);
    }
  }
</style>
