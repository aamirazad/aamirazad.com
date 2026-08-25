<script lang="ts">
  let {
    label,
    href,
    accent = "amber",
  }: { label: string; href: string; accent?: "amber" | "blue" | "violet" | "mint" } = $props();
</script>

<nav aria-label="Breadcrumb">
  <ol class="m-0 flex list-none items-center gap-2 p-0 text-sm font-[650]">
    <li><a class="text-muted no-underline hover:text-text" href="/">Aamir Azad</a></li>
    <li class="text-[#555]" aria-hidden="true">/</li>
    <li>
      <a
        class="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-muted no-underline hover:text-text"
        {href}
      >
        <span
          class:bg-amber={accent === "amber"}
          class:bg-blue={accent === "blue"}
          class:bg-violet={accent === "violet"}
          class:bg-mint={accent === "mint"}
          class="size-1.5 rounded-full"
          aria-hidden="true"
        ></span>
        {label}
      </a>
    </li>
  </ol>
</nav>
