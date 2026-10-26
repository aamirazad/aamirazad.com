<script lang="ts">
  import { page } from "$app/state";
  import SiteBar from "$lib/components/SiteBar.svelte";
  import TwilightScene from "$lib/components/TwilightScene.svelte";

  const notFound = $derived(page.status === 404);
</script>

<svelte:head>
  <title>{notFound ? "Page not found" : "Something went wrong"} · Aamir Azad</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<TwilightScene variant="backdrop" />

<div class="page-shell">
  <SiteBar />
  <main class="glass error">
    <p class="error-status">{page.status}</p>
    <h1 class="error-title">{notFound ? "This page isn't here" : "Something went wrong"}</h1>
    <p class="error-text">
      {notFound
        ? "It may have moved, or the link might be mistyped."
        : (page.error?.message ?? "Please try again in a moment.")}
    </p>
    <div class="error-actions">
      <a class="pane" href="/">Back home</a>
      <a class="pane" href="/archive">Browse writing</a>
    </div>
  </main>
</div>

<style lang="postcss">
  @reference "../app.css";

  .error {
    @apply mx-auto mt-[8vh] max-w-[34rem] rounded-[18px] p-[clamp(1.75rem,5vw,3rem)];
  }

  .error-status {
    @apply mb-2 font-serif text-[clamp(3.5rem,10vw,5.5rem)] leading-none text-[#f3c98b];
    text-shadow: 0 0 60px rgb(255 140 70 / 25%);
  }

  .error-title {
    @apply mb-3 font-serif text-[clamp(1.6rem,4vw,2.1rem)] font-normal text-[#fbf3ea];
  }

  .error-text {
    @apply mb-7 text-[#d8ccc2];
  }

  .error-actions {
    @apply flex flex-wrap gap-2;
  }

  .error-actions a {
    @apply rounded-full px-4 py-2 text-[0.9rem] font-medium text-[#efe3d8] no-underline hover:text-text;
  }
</style>
