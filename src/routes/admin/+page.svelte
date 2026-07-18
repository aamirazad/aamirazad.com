<script lang="ts">
  let { data } = $props();
</script>

<svelte:head>
  <title>Editor · Aamir Azad</title>
  <meta name="robots" content="noindex, nofollow" />
</svelte:head>

<main class="shell">
  <nav class="site-nav" aria-label="Editor navigation">
    <a href="/admin">Publishing</a>
    <form method="POST" action="/auth/logout"><button type="submit">Log out</button></form>
  </nav>

  <section class="admin-empty">
    <p class="eyebrow">Owner editor</p>
    <h1>Publishing</h1>
    <p>The editor is ready. Draft creation arrives in the next phase.</p>
    <p class="session-note">
      Authenticated as Pocket ID subject <code>{data.owner?.subject}</code>.
    </p>
  </section>
</main>

<style>
  form {
    margin: 0;
  }

  button {
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--soft);
    cursor: pointer;
  }

  .eyebrow {
    margin-bottom: 0.35rem;
    color: var(--soft);
    font-size: 0.75rem;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }

  .session-note {
    font-size: 0.85rem;
  }

  code {
    overflow-wrap: anywhere;
  }
</style>
