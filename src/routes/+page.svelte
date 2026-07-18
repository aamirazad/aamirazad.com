<script lang="ts">
  import {
    SITE_DESCRIPTION,
    SITE_NAME,
    SITE_ORIGIN,
    contactLinks,
    homelab,
    projects,
  } from "$lib/site";
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
  <nav class="site-nav" aria-label="Primary navigation">
    <a href="/">Aamir Azad</a>
    <ul>
      <li><a href="/on">On</a></li>
      <li><a href="/today">Today</a></li>
      <li><a href="/built">Built</a></li>
      <li><a href="/found">Found</a></li>
      <li><a href="/archive">Archive</a></li>
    </ul>
  </nav>

  <header class="hero">
    <h1>{SITE_NAME}</h1>
    <p class="subtitle">Student and developer</p>
    <p class="blurb">{SITE_DESCRIPTION}</p>
  </header>

  <section>
    <h2>Contact</h2>
    <div class="link-row">
      {#each contactLinks as link}
        <a href={link.href} rel="me noopener noreferrer">{link.label}</a>
      {/each}
    </div>
  </section>

  <section>
    <h2>Projects</h2>
    <p class="section-blurb">
      I spend most of my free time learning and building. Each project pushes me a little further
      and helps me prepare for what comes next.
    </p>
    <ul class="project-list">
      {#each projects as project}
        <li>
          <div class="item-header">
            {#if project.href}
              <a href={project.href} rel="noopener noreferrer">{project.name}</a>
            {:else}
              <span>{project.name}</span>
            {/if}
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
  </section>

  <section>
    <h2>Homelab</h2>
    <p class="section-blurb">
      I built a homelab to learn networking and run services I use every day. It spans a few
      machines and hosts storage and apps with reliable uptime.
    </p>
    <ul class="link-list">
      {#each homelab as item}
        <li>
          {#if item.href}<a href={item.href} rel="noopener noreferrer">{item.name}</a
            >{:else}{item.name}{/if}
        </li>
      {/each}
    </ul>
  </section>
</main>
