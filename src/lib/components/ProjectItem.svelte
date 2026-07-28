<script lang="ts">
  import type { SiteItem } from "$lib/site-content";

  let { project }: { project: SiteItem } = $props();
</script>

<article class="flex h-full flex-col rounded-xl bg-surface p-5">
  <div class="flex flex-wrap items-center gap-x-2.5 gap-y-2 font-[600]">
    {#if project.href}
      <a
        class="group inline-flex min-w-0 items-baseline gap-[0.2em] no-underline"
        href={project.href}
        target="_blank"
        rel="noopener noreferrer"
        ><span
          class="truncate text-current underline decoration-1 underline-offset-[0.22em] transition-colors duration-160 group-hover:text-muted"
          >{project.name}</span
        ><span
          class="text-blue no-underline transition-transform duration-160 group-hover:-translate-y-px group-hover:translate-x-px"
          aria-hidden="true">↗</span
        ></a
      >
    {:else}
      <span>{project.name}</span>
    {/if}

    {#if project.isWip}
      <span
        class="inline-grid size-[1.15rem] shrink-0 place-items-center text-amber"
        role="img"
        aria-label="Work in progress"
        title="Work in progress"
      >
        <svg class="size-full" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path
            d="M10 3a7 7 0 1 0 7 7"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          />
          <path
            d="M10 6.5V10l2.4 1.6"
            stroke="currentColor"
            stroke-width="1.7"
            stroke-linecap="round"
          />
        </svg>
      </span>
    {/if}

    {#if project.badge}
      <span
        class="inline-grid size-[1.15rem] shrink-0 place-items-center text-violet"
        role="img"
        aria-label={project.badge}
        title={project.badge}
      >
        <svg class="size-full" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path
            d="m10 2.7 1.85 4.27 4.65.44-3.5 3.09 1.02 4.55L10 12.68l-4.02 2.37L7 10.5 3.5 7.41l4.65-.44L10 2.7Z"
          />
        </svg>
      </span>
    {/if}
  </div>

  <p class="mt-2 mb-4 text-[0.92rem] leading-[1.55]">{project.description}</p>

  {#if project.github || project.codeUrl}
    <div class="mt-auto flex flex-wrap gap-3 text-xs text-soft">
      {#if project.github}
        <a
          class="no-underline hover:text-text"
          href={`https://github.com/${project.github}`}
          target="_blank"
          rel="noopener noreferrer">GitHub <span class="text-blue" aria-hidden="true">↗</span></a
        >
      {/if}
      {#if project.codeUrl}
        <a
          class="no-underline hover:text-text"
          href={project.codeUrl}
          target="_blank"
          rel="noopener noreferrer">Code <span class="text-blue" aria-hidden="true">↗</span></a
        >
      {/if}
    </div>
  {/if}
</article>
