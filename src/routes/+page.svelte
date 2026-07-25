<script lang="ts">
  import PublishedDate from "$lib/components/PublishedDate.svelte";
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
  const visibleHomelab = homelab.slice(0, 6);
  const moreHomelab = homelab.slice(6);

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

<main class="shell relative w-[min(calc(100%-2.5rem),1040px)]">
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
    class="relative isolate mb-14 min-h-76 overflow-hidden py-[clamp(2rem,6vw,4.5rem)] max-sm:min-h-68 max-sm:px-[1.4rem] max-sm:py-8"
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

  <section class="mt-0 border-t border-border pt-5" id="writing" aria-labelledby="writing-heading">
    <h2
      class="mb-5 font-serif text-[clamp(1.8rem,5vw,2.6rem)] tracking-[-0.03em] text-text normal-case"
      id="writing-heading"
    >
      Writing
    </h2>
    <div
      class="mb-6 flex gap-[1.35rem] border-b border-border"
      role="tablist"
      aria-label="Writing series"
    >
      {#each writingTabs as tab}
        <button
          class="relative cursor-pointer border-0 bg-transparent px-0 pt-[0.2rem] pb-[0.6rem] text-sm text-soft after:absolute after:right-0 after:bottom-[-1px] after:left-0 after:h-0.5 after:scale-x-0 after:bg-text after:content-[''] after:[transform-origin:center] after:[transition:transform_160ms_ease] hover:text-text focus-visible:text-text aria-selected:text-text aria-selected:after:scale-x-100"
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
        <ol class="m-0 list-none p-0">
          {#each visibleWriting as post}
            <li class="border-t border-border py-4">
              <a
                class="font-serif text-[clamp(1.15rem,2.5vw,1.45rem)] leading-tight font-semibold text-text no-underline hover:underline"
                href={post.canonicalPath}>{post.title}</a
              >
              {#if post.summary}<p class="mt-[0.35rem] mb-[0.45rem]">{post.summary}</p>{/if}
              <PublishedDate publishedAt={post.publishedAt} modifiedAt={post.modifiedAt} />
            </li>
          {/each}
        </ol>
        {#if activeWritingTab === "all"}
          <a class="mt-5 inline-block text-[0.86rem] font-[650] text-muted" href="/archive"
            >Show all writing <span class="ml-[0.35rem] text-blue">→</span></a
          >
        {/if}
      {:else}
        <div
          class="flex min-h-24 items-center gap-[0.55rem] border-y border-dashed border-border py-5"
        >
          <p class="m-0">No new posts</p>
        </div>
      {/if}
    </div>
  </section>

  <div class="mt-16 grid grid-cols-2 gap-[clamp(2.5rem,6vw,5rem)] max-sm:grid-cols-1">
    <section
      class="col-span-full mt-0 border-t border-t-[color-mix(in_srgb,var(--color-mint)_55%,var(--color-border))] pt-5 max-sm:col-auto"
    >
      <div class="mb-4">
        <h2
          class="mt-[0.1rem] mb-0 font-serif text-[clamp(1.8rem,5vw,2.6rem)] tracking-[-0.03em] text-text normal-case"
        >
          Projects
        </h2>
      </div>
      <p class="max-w-[62ch] pb-[1em]">
        Things I build to learn, solve a problem, or see how far an idea can go.
      </p>
      <ul class="m-0 grid list-none gap-5 p-0">
        {#each visibleProjects as project}
          <li class="border-b border-border pb-5 last:border-b-0 last:pb-0">
            <div class="flex flex-wrap items-center gap-x-[0.65rem] gap-y-2 font-[550]">
              {#if project.href}
                <a
                  class="group inline-flex items-baseline gap-[0.2em] no-underline"
                  href={project.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  ><span
                    class="text-current underline decoration-1 underline-offset-[0.22em] transition-colors duration-160 group-hover:text-muted"
                    >{project.name}</span
                  ><span
                    class="text-current no-underline transition-colors duration-160 group-hover:text-blue"
                    aria-hidden="true">↗</span
                  ></a
                >
              {:else}<span>{project.name}</span>{/if}
              {#if project.isWip}<span
                  class="rounded-full border border-border px-[0.55rem] py-[0.08rem] text-[0.65rem] font-medium tracking-[0.08em] text-soft uppercase"
                  >Work in progress</span
                >{/if}
              {#if project.badge}<span
                  class="rounded-full border border-border px-[0.55rem] py-[0.08rem] text-[0.65rem] font-medium tracking-[0.08em] text-soft uppercase"
                  >{project.badge}</span
                >{/if}
              {#if project.github}
                <a
                  class="group inline-flex items-baseline gap-[0.2em] text-xs text-soft no-underline"
                  href={`https://github.com/${project.github}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  ><span
                    class="text-current underline decoration-1 underline-offset-[0.22em] transition-colors duration-160 group-hover:text-muted"
                    >GitHub</span
                  ><span
                    class="text-current no-underline transition-colors duration-160 group-hover:text-blue"
                    aria-hidden="true">↗</span
                  ></a
                >
              {/if}
              {#if project.codeUrl}
                <a
                  class="group inline-flex items-baseline gap-[0.2em] text-xs text-soft no-underline"
                  href={project.codeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  ><span
                    class="text-current underline decoration-1 underline-offset-[0.22em] transition-colors duration-160 group-hover:text-muted"
                    >Code</span
                  ><span
                    class="text-current no-underline transition-colors duration-160 group-hover:text-blue"
                    aria-hidden="true">↗</span
                  ></a
                >
              {/if}
            </div>
            <p class="mt-[0.35rem] mb-0">{project.description}</p>
          </li>
        {/each}
      </ul>
      {#if moreProjects.length}
        <details class="section-expand">
          <summary>
            <span class="when-closed">Show {moreProjects.length} more projects</span>
            <span class="when-open">Show fewer projects</span>
          </summary>
          <ul class="m-0 grid list-none gap-5 p-0 pt-0">
            {#each moreProjects as project}
              <li class="border-b border-border pb-5 last:border-b-0 last:pb-0">
                <div class="flex flex-wrap items-center gap-x-[0.65rem] gap-y-2 font-[550]">
                  {#if project.href}
                    <a
                      class="group inline-flex items-baseline gap-[0.2em] no-underline"
                      href={project.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      ><span
                        class="text-current underline decoration-1 underline-offset-[0.22em] transition-colors duration-160 group-hover:text-muted"
                        >{project.name}</span
                      ><span
                        class="text-current no-underline transition-colors duration-160 group-hover:text-blue"
                        aria-hidden="true">↗</span
                      ></a
                    >
                  {:else}<span>{project.name}</span>{/if}
                  {#if project.isWip}<span
                      class="rounded-full border border-border px-[0.55rem] py-[0.08rem] text-[0.65rem] font-medium tracking-[0.08em] text-soft uppercase"
                      >Work in progress</span
                    >{/if}
                  {#if project.badge}<span
                      class="rounded-full border border-border px-[0.55rem] py-[0.08rem] text-[0.65rem] font-medium tracking-[0.08em] text-soft uppercase"
                      >{project.badge}</span
                    >{/if}
                  {#if project.github}
                    <a
                      class="group inline-flex items-baseline gap-[0.2em] text-xs text-soft no-underline"
                      href={`https://github.com/${project.github}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      ><span
                        class="text-current underline decoration-1 underline-offset-[0.22em] transition-colors duration-160 group-hover:text-muted"
                        >GitHub</span
                      ><span
                        class="text-current no-underline transition-colors duration-160 group-hover:text-blue"
                        aria-hidden="true">↗</span
                      ></a
                    >
                  {/if}
                  {#if project.codeUrl}
                    <a
                      class="group inline-flex items-baseline gap-[0.2em] text-xs text-soft no-underline"
                      href={project.codeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      ><span
                        class="text-current underline decoration-1 underline-offset-[0.22em] transition-colors duration-160 group-hover:text-muted"
                        >Code</span
                      ><span
                        class="text-current no-underline transition-colors duration-160 group-hover:text-blue"
                        aria-hidden="true">↗</span
                      ></a
                    >
                  {/if}
                </div>
                <p class="mt-[0.35rem] mb-0">{project.description}</p>
              </li>
            {/each}
          </ul>
        </details>
      {/if}
    </section>

    <section
      class="mt-0 border-t border-t-[color-mix(in_srgb,var(--color-blue)_55%,var(--color-border))] pt-5"
    >
      <div class="mb-4">
        <h2
          class="mt-[0.1rem] mb-0 font-serif text-[clamp(1.8rem,5vw,2.6rem)] tracking-[-0.03em] text-text normal-case"
        >
          Links
        </h2>
      </div>
      <p class="max-w-[62ch] pb-[1em]">Code, contact details, and a few other places to find me.</p>
      <ul class="m-0 grid list-none grid-cols-2 gap-2 p-0 max-sm:grid-cols-1">
        {#each visibleLinks as link}
          <li>
            <a
              class="flex items-center justify-between gap-2 border-b border-border py-[0.4rem] text-muted"
              href={link.href}
              rel="me">{link.name}</a
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
                  class="flex items-center justify-between gap-2 border-b border-border py-[0.4rem] text-muted"
                  href={link.href}
                  rel="me">{link.name}</a
                >
              </li>
            {/each}
          </ul>
        </details>
      {/if}
    </section>

    <section
      class="mt-0 border-t border-t-[color-mix(in_srgb,var(--color-violet)_55%,var(--color-border))] pt-5"
    >
      <div class="mb-4">
        <h2
          class="mt-[0.1rem] mb-0 font-serif text-[clamp(1.8rem,5vw,2.6rem)] tracking-[-0.03em] text-text normal-case"
        >
          Homelab
        </h2>
      </div>
      <p class="max-w-[62ch] pb-[1em]">The services and systems I run, maintain, and learn from.</p>
      <ul
        class="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(9rem,1fr))] gap-[0.45rem] p-0"
      >
        {#each visibleHomelab as item}
          <li class="border-b border-border pb-[0.45rem]">
            {#if item.href}
              <a
                class="flex items-center justify-between gap-2 text-[0.84rem] text-muted"
                href={item.href}>{item.name}</a
              >
            {:else}<span class="text-[0.84rem]">{item.name}</span>{/if}
          </li>
        {/each}
      </ul>
      {#if moreHomelab.length}
        <details class="section-expand">
          <summary>
            <span class="when-closed">Show {moreHomelab.length} more services</span>
            <span class="when-open">Show fewer services</span>
          </summary>
          <ul
            class="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(9rem,1fr))] gap-[0.45rem] p-0 pt-0"
          >
            {#each moreHomelab as item}
              <li class="border-b border-border pb-[0.45rem]">
                {#if item.href}
                  <a
                    class="flex items-center justify-between gap-2 text-[0.84rem] text-muted"
                    href={item.href}>{item.name}</a
                  >
                {:else}<span class="text-[0.84rem]">{item.name}</span>{/if}
              </li>
            {/each}
          </ul>
        </details>
      {/if}
    </section>
  </div>
</main>

<style lang="postcss">
  @reference "../app.css";

  .section-expand {
    @apply mt-5 border-t border-border open:pb-6;
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
    @apply mb-7;
  }

  .section-expand > summary {
    @apply cursor-pointer list-none pt-4 text-[0.82rem] font-[650] text-muted;
  }

  .section-expand > summary::-webkit-details-marker {
    display: none;
  }

  .section-expand > summary::after {
    @apply float-right text-soft content-['+'];
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
</style>
