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

<main class="shell homepage">
  <nav class="homepage-actions" aria-label="Contact">
    <a href="/github" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
      <img src="/icons/github.svg" alt="" />
    </a>
    <a href="mailto:aamirmazad@gmail.com" aria-label="Email Aamir Azad">
      <img src="/icons/mail.svg" alt="" />
    </a>
  </nav>

  <header class="hero">
    <h1>{SITE_NAME}</h1>
    <p class="blurb">{SITE_DESCRIPTION}</p>
  </header>

  <section class="writing-section" id="writing" aria-labelledby="writing-heading">
    <h2 id="writing-heading">Writing</h2>
    <div class="writing-tabs" role="tablist" aria-label="Writing series">
      {#each writingTabs as tab}
        <button
          type="button"
          role="tab"
          id={`writing-tab-${tab.id}`}
          aria-selected={activeWritingTab === tab.id}
          aria-controls="writing-panel"
          onclick={() => selectWritingTab(tab.id)}>{tab.label}</button
        >
      {/each}
    </div>

    <div
      class="writing-panel"
      id="writing-panel"
      role="tabpanel"
      aria-labelledby={`writing-tab-${activeWritingTab}`}
    >
      {#if activeWriting.description}
        <p class="writing-description">{activeWriting.description}</p>
      {/if}

      {#if visibleWriting.length}
        <ol class="writing-list">
          {#each visibleWriting as post}
            <li>
              <a href={post.canonicalPath}>{post.title}</a>
              {#if post.summary}<p>{post.summary}</p>{/if}
              <PublishedDate publishedAt={post.publishedAt} modifiedAt={post.modifiedAt} />
            </li>
          {/each}
        </ol>
        {#if activeWritingTab === "all"}
          <a class="writing-all" href="/archive">Show all writing <span>→</span></a>
        {/if}
      {:else}
        <div class="writing-empty">
          <p>No new posts</p>
        </div>
      {/if}
    </div>
  </section>

  <div class="homepage-sections">
    <section class="homepage-section projects-section">
      <div class="homepage-section-heading">
        <h2>Projects</h2>
      </div>
      <p class="section-blurb">
        Things I build to learn, solve a problem, or see how far an idea can go.
      </p>
      <ul class="project-list">
        {#each visibleProjects as project}
          <li>
            <div class="item-header">
              {#if project.href}
                <a href={project.href} target="_blank" rel="noopener noreferrer"
                  ><span class="external-link-text">{project.name}</span><span
                    class="external-link-icon"
                    aria-hidden="true">↗</span
                  ></a
                >
              {:else}<span>{project.name}</span>{/if}
              {#if project.wip}<span class="tag">Work in progress</span>{/if}
              {#if project.badge}<span class="tag">{project.badge}</span>{/if}
              {#if project.github}
                <a
                  class="meta-link"
                  href={`https://github.com/${project.github}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  ><span class="external-link-text">GitHub</span><span
                    class="external-link-icon"
                    aria-hidden="true">↗</span
                  ></a
                >
              {/if}
              {#if project.code}
                <a class="meta-link" href={project.code} target="_blank" rel="noopener noreferrer"
                  ><span class="external-link-text">Code</span><span
                    class="external-link-icon"
                    aria-hidden="true">↗</span
                  ></a
                >
              {/if}
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
                    <a href={project.href} target="_blank" rel="noopener noreferrer"
                      ><span class="external-link-text">{project.name}</span><span
                        class="external-link-icon"
                        aria-hidden="true">↗</span
                      ></a
                    >
                  {:else}<span>{project.name}</span>{/if}
                  {#if project.wip}<span class="tag">Work in progress</span>{/if}
                  {#if project.badge}<span class="tag">{project.badge}</span>{/if}
                  {#if project.github}
                    <a
                      class="meta-link"
                      href={`https://github.com/${project.github}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      ><span class="external-link-text">GitHub</span><span
                        class="external-link-icon"
                        aria-hidden="true">↗</span
                      ></a
                    >
                  {/if}
                  {#if project.code}
                    <a
                      class="meta-link"
                      href={project.code}
                      target="_blank"
                      rel="noopener noreferrer"
                      ><span class="external-link-text">Code</span><span
                        class="external-link-icon"
                        aria-hidden="true">↗</span
                      ></a
                    >
                  {/if}
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
        <h2>Links</h2>
      </div>
      <p class="section-blurb">Code, contact details, and a few other places to find me.</p>
      <ul class="link-list featured-links">
        {#each visibleLinks as link}
          <li>
            <a href={link.href} rel="me">{link.label}</a>
          </li>
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
                <a href={link.href} rel="me">{link.label}</a>
              </li>
            {/each}
          </ul>
        </details>
      {/if}
    </section>

    <section class="homepage-section homelab-section">
      <div class="homepage-section-heading">
        <h2>Homelab</h2>
      </div>
      <p class="section-blurb">The services and systems I run, maintain, and learn from.</p>
      <ul class="link-list service-list">
        {#each visibleHomelab as item}
          <li>
            {#if item.href}
              <a href={item.href}>{item.name}</a>
            {:else}<span>{item.name}</span>{/if}
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
                {#if item.href}
                  <a href={item.href}>{item.name}</a>
                {:else}<span>{item.name}</span>{/if}
              </li>
            {/each}
          </ul>
        </details>
      {/if}
    </section>
  </div>
</main>
