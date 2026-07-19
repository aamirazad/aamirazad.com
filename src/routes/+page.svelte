<script lang="ts">
  import PublishedDate from "$lib/components/PublishedDate.svelte";
  import {
    SITE_DESCRIPTION,
    SITE_NAME,
    SITE_ORIGIN,
    contactLinks,
    homelab,
    projects,
  } from "$lib/site";

  let { data } = $props();

  const visibleProjects = projects.slice(0, 3);
  const moreProjects = projects.slice(3);
  const visibleLinks = contactLinks.slice(0, 5);
  const moreLinks = contactLinks.slice(5);
  const visibleHomelab = homelab.slice(0, 5);
  const moreHomelab = homelab.slice(5);
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

<main class="shell homepage">
  <nav class="site-nav homepage-nav" aria-label="Primary navigation">
    <a href="/">Aamir Azad</a>
    <ul>
      <li><a class="series-on" href="/on">On</a></li>
      <li><a class="series-today" href="/today">Today</a></li>
      <li><a class="series-built" href="/built">Built</a></li>
      <li><a class="series-found" href="/found">Found</a></li>
      <li><a class="series-archive" href="/archive">Archive</a></li>
    </ul>
  </nav>

  <header class="hero">
    <p class="hero-kicker">Student · developer · curious human</p>
    <h1>{SITE_NAME}</h1>
    <p class="blurb">{SITE_DESCRIPTION}</p>
    <div class="hero-shapes" aria-hidden="true"><span></span><span></span><span></span></div>
  </header>

  {#if data.featured}
    <article class="featured-post">
      <header>
        <p class={`eyebrow series-ink series-${data.featured.series}`}>
          {data.featured.series} · {data.featured.format}
        </p>
        <h2><a href={data.featured.canonicalPath}>{data.featured.title}</a></h2>
        {#if data.featured.summary}<p class="featured-summary">{data.featured.summary}</p>{/if}
        <PublishedDate
          publishedAt={data.featured.publishedAt}
          modifiedAt={data.featured.modifiedAt}
        />
      </header>
      {#if data.featured.html}
        <div class="featured-excerpt">
          <div class="rendered-markdown">{@html data.featured.html}</div>
        </div>
      {/if}
      <a class="read-more" href={data.featured.canonicalPath}>Read the full post <span>→</span></a>
    </article>
  {:else}
    <section class="empty-feature">
      <p>New writing will appear here soon.</p>
    </section>
  {/if}

  <div class="homepage-sections">
    <section class="homepage-section projects-section">
      <div class="homepage-section-heading">
        <div>
          <p class="eyebrow">Making</p>
          <h2>Projects</h2>
        </div>
        <span class="section-number" aria-hidden="true">01</span>
      </div>
      <p class="section-blurb">
        Things I build to learn, solve a problem, or see how far an idea can go.
      </p>
      <ul class="project-list">
        {#each visibleProjects as project}
          <li>
            <div class="item-header">
              {#if project.href}
                <a href={project.href} rel="noopener noreferrer">{project.name}</a>
              {:else}<span>{project.name}</span>{/if}
              {#if project.wip}<span class="tag">Work in progress</span>{/if}
              {#if project.badge}<span class="tag">{project.badge}</span>{/if}
              {#if project.github}
                <a class="meta-link" href={`https://github.com/${project.github}`}>GitHub</a>
              {/if}
              {#if project.code}<a class="meta-link" href={project.code}>Code</a>{/if}
            </div>
            <p class="item-description">{project.description}</p>
          </li>
        {/each}
      </ul>
      {#if moreProjects.length}
        <details class="section-expand">
          <summary>
            <span class="when-closed">Show {moreProjects.length} more projects</span>
            <span class="when-open">Show fewer projects</span>
          </summary>
          <ul class="project-list expanded-list">
            {#each moreProjects as project}
              <li>
                <div class="item-header">
                  {#if project.href}
                    <a href={project.href} rel="noopener noreferrer">{project.name}</a>
                  {:else}<span>{project.name}</span>{/if}
                  {#if project.wip}<span class="tag">Work in progress</span>{/if}
                  {#if project.badge}<span class="tag">{project.badge}</span>{/if}
                  {#if project.github}
                    <a class="meta-link" href={`https://github.com/${project.github}`}>GitHub</a>
                  {/if}
                  {#if project.code}<a class="meta-link" href={project.code}>Code</a>{/if}
                </div>
                <p class="item-description">{project.description}</p>
              </li>
            {/each}
          </ul>
        </details>
      {/if}
    </section>

    <section class="homepage-section links-section">
      <div class="homepage-section-heading">
        <div>
          <p class="eyebrow">Elsewhere</p>
          <h2>Links</h2>
        </div>
        <span class="section-number" aria-hidden="true">02</span>
      </div>
      <p class="section-blurb">Code, contact details, and a few other places to find me.</p>
      <ul class="link-list featured-links">
        {#each visibleLinks as link}
          <li><a href={link.href} rel="me noopener noreferrer">{link.label}<span>↗</span></a></li>
        {/each}
      </ul>
      {#if moreLinks.length}
        <details class="section-expand">
          <summary>
            <span class="when-closed">Show {moreLinks.length} more links</span>
            <span class="when-open">Show fewer links</span>
          </summary>
          <ul class="link-list featured-links expanded-list">
            {#each moreLinks as link}
              <li>
                <a href={link.href} rel="me noopener noreferrer">{link.label}<span>↗</span></a>
              </li>
            {/each}
          </ul>
        </details>
      {/if}
    </section>

    <section class="homepage-section homelab-section">
      <div class="homepage-section-heading">
        <div>
          <p class="eyebrow">Self-hosted</p>
          <h2>Homelab</h2>
        </div>
        <span class="section-number" aria-hidden="true">03</span>
      </div>
      <p class="section-blurb">The services and systems I run, maintain, and learn from.</p>
      <ul class="link-list service-list">
        {#each visibleHomelab as item}
          <li>
            {#if item.href}<a href={item.href} rel="noopener noreferrer">{item.name}</a>{:else}<span
                >{item.name}</span
              >{/if}
          </li>
        {/each}
      </ul>
      {#if moreHomelab.length}
        <details class="section-expand">
          <summary>
            <span class="when-closed">Show {moreHomelab.length} more services</span>
            <span class="when-open">Show fewer services</span>
          </summary>
          <ul class="link-list service-list expanded-list">
            {#each moreHomelab as item}
              <li>
                {#if item.href}<a href={item.href} rel="noopener noreferrer">{item.name}</a
                  >{:else}<span>{item.name}</span>{/if}
              </li>
            {/each}
          </ul>
        </details>
      {/if}
    </section>
  </div>
</main>
