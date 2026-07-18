<script lang="ts">
  import "../app.css";

  let { children } = $props();
</script>

<svelte:head>
  <meta name="robots" content="index, follow" />
  <meta name="theme-color" content="#0b0b0b" />
  <meta name="color-scheme" content="dark" />
  <link rel="icon" href="/favicon.svg" />
</svelte:head>

{@render children()}
