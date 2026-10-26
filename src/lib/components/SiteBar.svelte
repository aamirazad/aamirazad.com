<script lang="ts">
  import { SITE_NAME } from "$lib/site";

  let { current }: { current?: "archive" } = $props();
</script>

<nav class="site-bar" aria-label="Site">
  <a class="site-bar-name" href="/">{SITE_NAME}</a>
  <ul class="site-bar-links">
    <li>
      <a href="/archive" aria-current={current === "archive" ? "page" : undefined}>Writing</a>
    </li>
    <li>
      <a
        class="site-bar-icon"
        href="/github"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="GitHub"
      >
        <img src="/icons/github.svg" alt="" />
      </a>
    </li>
    <li>
      <a class="site-bar-icon" href="mailto:aamirmazad@gmail.com" aria-label="Email Aamir Azad">
        <img src="/icons/mail.svg" alt="" />
      </a>
    </li>
  </ul>
</nav>

<style lang="postcss">
  @reference "../../app.css";

  .site-bar {
    @apply flex items-center justify-between gap-4 pt-5 pr-12 pb-[clamp(2.5rem,7vh,4.5rem)] text-sm;
  }

  .site-bar a {
    text-shadow: 0 1px 12px rgb(0 0 0 / 60%);
  }

  .site-bar-name {
    @apply font-serif text-[1.15rem] text-[#fbf3ea] no-underline;
  }

  .site-bar-links {
    @apply m-0 flex list-none items-center gap-1 p-0;
  }

  .site-bar-links a:not(.site-bar-icon) {
    @apply mr-2 font-medium text-[#eadfd6] no-underline opacity-80 hover:opacity-100;
  }

  .site-bar-links a[aria-current="page"] {
    @apply opacity-100;
  }

  .site-bar-icon {
    @apply grid size-9 place-items-center rounded-full no-underline hover:bg-white/10 focus-visible:bg-white/10;
  }

  .site-bar-icon img {
    @apply size-4 opacity-85 invert;
  }
</style>
