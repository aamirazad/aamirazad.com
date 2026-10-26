<script lang="ts">
  import PublishedDate from "$lib/components/PublishedDate.svelte";
  import ProjectItem from "$lib/components/ProjectItem.svelte";
  import TwilightScene from "$lib/components/TwilightScene.svelte";
  import { liquidGlass } from "$lib/liquid-glass";
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
  // svelte-ignore state_referenced_locally -- page data is fixed for this public page instance
  const latestPost = data.writing[0];
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

<TwilightScene />

<header class="hero">
  <nav class="hero-nav" aria-label="Site">
    <ul class="hero-sections">
      <li><a href="#projects">Projects</a></li>
      <li><a href="#links">Links</a></li>
      <li><a href="#homelab">Homelab</a></li>
      {#if data.writing.length}<li><a href="#writing">Writing</a></li>{/if}
    </ul>
    <ul class="hero-contact">
      <li>
        <a href="/github" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
          <img src="/icons/github.svg" alt="" />
        </a>
      </li>
      <li>
        <a href="mailto:aamirmazad@gmail.com" aria-label="Email Aamir Azad">
          <img src="/icons/mail.svg" alt="" />
        </a>
      </li>
    </ul>
  </nav>

  <div class="hero-body">
    <div class="hero-intro">
      <h1 class="hero-title">{SITE_NAME}</h1>
      <p class="hero-lede">{SITE_DESCRIPTION}</p>
    </div>

    <div class="hero-stage">
      <div class="hero-card glass" data-tilt use:liquidGlass={{ radius: 16 }}>
        <ol class="hero-card-list">
          <li>
            <a href="#projects">
              <span class="hero-card-dot text-amber" aria-hidden="true"></span>
              <span class="hero-card-text">
                <span class="hero-card-name">Projects</span>
                <span class="hero-card-hint">{projects.length} things I've built</span>
              </span>
              <span class="hero-card-arrow" aria-hidden="true">↓</span>
            </a>
          </li>
          <li>
            <a href="#links">
              <span class="hero-card-dot text-mint" aria-hidden="true"></span>
              <span class="hero-card-text">
                <span class="hero-card-name">Links</span>
                <span class="hero-card-hint">Code, contact, and elsewhere</span>
              </span>
              <span class="hero-card-arrow" aria-hidden="true">↓</span>
            </a>
          </li>
          <li>
            <a href="#homelab">
              <span class="hero-card-dot text-ember" aria-hidden="true"></span>
              <span class="hero-card-text">
                <span class="hero-card-name">Homelab</span>
                <span class="hero-card-hint">{homelab.length} services I run</span>
              </span>
              <span class="hero-card-arrow" aria-hidden="true">↓</span>
            </a>
          </li>
          {#if latestPost}
            <li>
              <a href={latestPost.canonicalPath}>
                <span class="hero-card-dot text-violet" aria-hidden="true"></span>
                <span class="hero-card-text">
                  <span class="hero-card-name">Latest writing</span>
                  <span class="hero-card-hint truncate">{latestPost.title}</span>
                </span>
                <span class="hero-card-arrow" aria-hidden="true">→</span>
              </a>
            </li>
          {/if}
        </ol>
      </div>
    </div>
  </div>

  <div class="hero-foot">
    <p class="hero-credit">
      Painting:
      <a href="https://www.clevelandart.org/art/1965.233" target="_blank" rel="noopener noreferrer"
        ><cite>Twilight in the Wilderness</cite></a
      >, Frederic Edwin Church, 1860
    </p>
    <a
      class="hero-scroll glass"
      href="#projects"
      use:liquidGlass={{ radius: 18, bezel: 14, refraction: 22, blur: 2 }}
      >Scroll <span aria-hidden="true">↓</span></a
    >
  </div>
</header>

<main class="home">
  <section
    class="panel glass"
    id="projects"
    aria-labelledby="projects-heading"
    use:liquidGlass={{ radius: 18, bezel: 44, refraction: 120, blur: 6 }}
  >
    <header class="panel-head">
      <h2 class="section-title section-title-projects" id="projects-heading">Projects</h2>
      <p>Things I build to learn, solve a problem, or see how far an idea can go.</p>
    </header>
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

  <div class="grid grid-cols-2 gap-6 max-md:grid-cols-1">
    <section
      class="panel glass"
      id="links"
      aria-labelledby="links-heading"
      use:liquidGlass={{ radius: 18, bezel: 44, refraction: 120, blur: 6 }}
    >
      <header class="panel-head">
        <h2 class="section-title section-title-links" id="links-heading">Links</h2>
        <p>Code, contact details, and a few other places to find me.</p>
      </header>
      <ul class="m-0 grid list-none grid-cols-2 gap-2 p-0 max-sm:grid-cols-1">
        {#each visibleLinks as link}
          <li>
            <a class="tile group" href={link.href} rel="me"
              >{link.name}<span
                class="text-mint transition-transform duration-160 group-hover:translate-x-0.5"
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
                <a class="tile group" href={link.href} rel="me"
                  >{link.name}<span
                    class="text-mint transition-transform duration-160 group-hover:translate-x-0.5"
                    aria-hidden="true">→</span
                  ></a
                >
              </li>
            {/each}
          </ul>
        </details>
      {/if}
    </section>

    <section
      class="panel glass"
      id="homelab"
      aria-labelledby="homelab-heading"
      use:liquidGlass={{ radius: 18, bezel: 44, refraction: 120, blur: 6 }}
    >
      <header class="panel-head">
        <h2 class="section-title section-title-homelab" id="homelab-heading">Homelab</h2>
        <p>The services and systems I run, maintain, and learn from.</p>
      </header>

      <h3 class="sr-only">Public services</h3>
      <ul class="m-0 grid list-none grid-cols-2 gap-2 p-0">
        {#each visibleHomelab as item}
          <li>
            <a class="tile group text-[0.84rem]" href={item.href}
              >{item.name}<span
                class="text-ember transition-transform duration-160 group-hover:-translate-y-px group-hover:translate-x-px"
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
                <a class="tile group text-[0.84rem]" href={item.href}
                  >{item.name}<span
                    class="text-ember transition-transform duration-160 group-hover:-translate-y-px group-hover:translate-x-px"
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
          <h3 class="sr-only">Private services</h3>
          <ul class="m-0 flex list-none flex-wrap gap-2 p-0">
            {#each privateHomelab as item}
              <li class="private-chip">
                <svg class="size-3 text-soft" viewBox="0 0 16 16" fill="none" aria-hidden="true">
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
    <section
      class="panel glass"
      id="writing"
      aria-labelledby="writing-heading"
      use:liquidGlass={{ radius: 18, bezel: 44, refraction: 120, blur: 6 }}
    >
      <header class="panel-head panel-head-row">
        <h2 class="section-title section-title-writing" id="writing-heading">Writing</h2>
        <a class="text-[0.86rem] font-[650] text-muted no-underline hover:text-text" href="/archive"
          >All writing <span class="ml-[0.35rem] text-amber">→</span></a
        >
      </header>
      <ol class="m-0 grid list-none gap-2 p-0">
        {#each data.writing as post}
          <li>
            <a
              class="writing-row tile group gap-3 text-[0.92rem] max-sm:flex-wrap"
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

  <footer class="home-footer">
    <span>© {SITE_NAME}</span>
    <a href="#top" class="no-underline hover:text-text">Back to the top ↑</a>
  </footer>
</main>

<style lang="postcss">
  @reference "../app.css";

  :global(html) {
    scroll-behavior: smooth;
    scroll-padding-top: 1.5rem;
  }

  @media (prefers-reduced-motion: reduce) {
    :global(html) {
      scroll-behavior: auto;
    }
  }

  /* ---------- Hero: sits between the painted sky and the near trees ---------- */

  .hero {
    @apply relative mx-auto flex min-h-svh flex-col;
    width: min(calc(100% - 2.5rem), 1280px);
  }

  .hero-nav {
    @apply relative z-30 flex items-center justify-between gap-4 pt-5 pr-14 text-sm;
  }

  .hero-sections {
    @apply m-0 flex list-none flex-wrap gap-x-5 gap-y-1 p-0;
  }

  .hero-sections a {
    @apply font-medium text-[#eadfd6] no-underline opacity-80 hover:opacity-100;
    text-shadow: 0 1px 12px rgb(0 0 0 / 60%);
  }

  .hero-contact {
    @apply m-0 flex list-none gap-1 p-0;
  }

  .hero-contact a {
    @apply grid size-9 place-items-center rounded-full no-underline hover:bg-white/10 focus-visible:bg-white/10;
  }

  .hero-contact img {
    @apply size-4 opacity-85 invert;
  }

  .hero-body {
    @apply grid flex-1 grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] items-center gap-x-10 gap-y-10 py-10;
  }

  .hero-intro {
    @apply relative z-30 self-center pb-[6vh];
  }

  .hero-title {
    @apply mb-5 font-serif font-normal text-[#fbf3ea];
    font-size: clamp(3.4rem, 9vw, 8.25rem);
    line-height: 0.92;
    letter-spacing: -0.035em;
    text-shadow:
      0 2px 30px rgb(30 10 5 / 65%),
      0 0 80px rgb(255 140 70 / 18%);
  }

  .hero-lede {
    @apply m-0 max-w-[34ch] text-[clamp(1.05rem,1.7vw,1.3rem)] leading-[1.55] text-[#efe3d8];
    text-shadow: 0 1px 18px rgb(0 0 0 / 75%);
  }

  .hero-stage {
    @apply relative z-10 self-center;
    perspective: 1100px;
  }

  .hero-card {
    @apply rounded-[16px] p-2;
    max-width: 23rem;
    will-change: transform;
  }

  .hero-card-list {
    @apply m-0 grid list-none gap-1 p-0;
  }

  .hero-card-list a {
    @apply flex items-center gap-3 rounded-[10px] px-3.5 py-2.5 no-underline transition-colors duration-160 hover:bg-white/8 focus-visible:bg-white/8;
  }

  .hero-card-dot {
    @apply size-2 shrink-0 rounded-full bg-current;
    box-shadow: 0 0 12px currentColor;
  }

  .hero-card-text {
    @apply grid min-w-0 flex-1;
  }

  .hero-card-name {
    @apply text-[0.95rem] font-semibold text-text;
  }

  .hero-card-name,
  .hero-card-hint {
    text-shadow: 0 1px 8px rgb(0 0 0 / 45%);
  }

  .hero-card-hint {
    @apply text-[0.8rem] text-[#c9bcb2];
  }

  .hero-card-arrow {
    @apply text-[#c9bcb2] transition-transform duration-160;
  }

  .hero-card-list a:hover .hero-card-arrow {
    @apply translate-x-0.5 text-text;
  }

  .hero-foot {
    @apply relative z-30 flex items-end justify-between gap-4 pb-5 text-[0.8rem] text-[#d9cabd];
  }

  .hero-credit {
    @apply m-0 text-inherit opacity-75;
    text-shadow: 0 1px 10px rgb(0 0 0 / 80%);
  }

  .hero-credit a {
    @apply underline decoration-white/30 hover:decoration-white;
  }

  .hero-scroll {
    @apply inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[#f2e8df] no-underline;
  }

  /* Medium screens: the trees would hide most of the card, so let it float in front. */
  @media (max-width: 72rem) {
    .hero-stage {
      @apply z-30;
    }
  }

  @media (max-width: 52rem) {
    .hero-body {
      @apply grid-cols-1 content-center gap-y-8;
    }

    .hero-intro {
      @apply pb-0;
    }

    .hero-card {
      @apply mx-0 max-w-none;
    }

    .hero-sections {
      @apply hidden;
    }

    .hero-nav {
      @apply justify-end;
    }
  }

  /* ---------- Content panels: glass over the sky, in front of the trees ---------- */

  .home {
    @apply relative z-25 mx-auto grid gap-6 pt-[8vh] pb-10;
    width: min(calc(100% - 2.5rem), 1120px);
  }

  .panel {
    @apply rounded-[18px] p-[clamp(1.25rem,3vw,2.25rem)];
    /* Lifts type off the brighter parts of the sky (the horizon glow) seen through the glass. */
    text-shadow: 0 1px 10px rgb(0 0 0 / 35%);
  }

  .panel-head {
    @apply mb-5;
  }

  .panel-head p {
    @apply mt-2 mb-0 max-w-[62ch] text-[#d8ccc2];
  }

  .panel-head-row {
    @apply flex items-baseline justify-between gap-4;
  }

  .section-title {
    @apply m-0 flex items-center gap-3 font-serif text-[clamp(1.7rem,4vw,2.35rem)] tracking-[-0.03em] text-text normal-case;
  }

  .section-title::before {
    @apply h-6 w-1 rounded-full bg-current content-[''];
    box-shadow: 0 0 14px currentColor;
  }

  .section-title-projects::before {
    @apply text-amber;
  }

  .section-title-links::before {
    @apply text-mint;
  }

  .section-title-homelab::before {
    @apply text-ember;
  }

  .section-title-writing::before {
    @apply text-violet;
  }

  /* Inner pieces are slightly lighter panes resting on the glass. */
  .tile {
    @apply flex items-center justify-between gap-2 rounded-[10px] px-3.5 py-2 text-[0.88rem] text-[#e4d9d0] no-underline transition-colors duration-160 hover:text-text;
    background: rgb(255 248 242 / 6%);
  }

  .tile:hover,
  .tile:focus-visible {
    background: rgb(255 248 242 / 11%);
  }

  .private-chip {
    @apply inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[0.78rem] text-[#c9bcb2];
    background: rgb(10 6 6 / 22%);
  }

  .writing-row {
    @apply justify-start;
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
    @apply inline-flex cursor-pointer list-none items-center gap-3 rounded-full px-3.5 py-2 text-[0.8rem] font-[650] text-[#e4d9d0] hover:text-text;
    background: rgb(255 248 242 / 6%);
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

  .home-footer {
    @apply flex justify-between gap-4 px-2 pt-4 text-[0.8rem] text-soft;
  }

  @media (max-width: 40rem) {
    .hero,
    .home {
      width: min(calc(100% - 2rem), 1120px);
    }
  }
</style>
