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
    class="relative isolate mb-6 py-[clamp(2rem,5vw,3.75rem)] max-sm:px-[1.15rem] max-sm:py-8"
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

  <div class="grid grid-cols-2 gap-x-[clamp(2.5rem,6vw,5rem)] gap-y-14 max-sm:grid-cols-1">
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

  {#if data.writing.length}
    <section class="mt-14" id="writing" aria-labelledby="writing-heading">
      <div class="mb-4 flex items-baseline justify-between gap-4">
        <h2
          class="section-title section-title-writing m-0 font-serif text-[clamp(1.5rem,4vw,2rem)] tracking-[-0.03em] text-text normal-case"
          id="writing-heading"
        >
          Writing
        </h2>
        <a class="text-[0.86rem] font-[650] text-muted" href="/archive"
          >All writing <span class="ml-[0.35rem] text-blue">→</span></a
        >
      </div>
      <ol class="m-0 grid list-none gap-2 p-0">
        {#each data.writing as post}
          <li>
            <a
              class="writing-row group flex items-center gap-3 rounded-lg bg-surface px-3 py-2 text-[0.92rem] text-muted no-underline hover:text-text max-sm:flex-wrap"
              href={post.canonicalPath}
              data-series={post.series}
            >
              <span class="writing-series inline-flex items-center gap-1.5 text-xs">
                <span class="size-1.5 rounded-full bg-current" aria-hidden="true"></span>
                {post.series}
              </span>
              <span class="min-w-0 flex-1 truncate font-serif font-semibold text-text"
                >{post.title}</span
              >
              <PublishedDate
                publishedAt={post.publishedAt}
                modifiedAt={post.modifiedAt}
                showLabel={false}
              />
            </a>
          </li>
        {/each}
      </ol>
    </section>
  {/if}
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

  .writing-row:hover {
    background: #161616;
  }

  .writing-series {
    text-transform: capitalize;
  }

  .writing-row[data-series="on"] .writing-series {
    @apply text-blue;
  }

  .writing-row[data-series="today"] .writing-series {
    @apply text-mint;
  }

  .writing-row[data-series="found"] .writing-series {
    @apply text-violet;
  }

  .writing-row[data-series="built"] .writing-series {
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
