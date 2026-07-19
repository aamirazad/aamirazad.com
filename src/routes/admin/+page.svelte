<script lang="ts">
  let { data, form } = $props();
</script>

<svelte:head>
  <title>Publishing · Aamir Azad</title>
  <meta name="robots" content="noindex, nofollow" />
</svelte:head>

<main class="shell admin-shell">
  <nav class="site-nav" aria-label="Editor navigation">
    <a href="/admin">Publishing</a>
    <form method="POST" action="/auth/logout">
      <button class="button-link" type="submit">Log out</button>
    </form>
  </nav>

  <header class="admin-header">
    <div>
      <p class="eyebrow">Owner editor</p>
      <h1>Publishing</h1>
    </div>
    <p class="session-note">Signed in through Pocket ID</p>
  </header>

  <section class="panel compact-panel">
    <div>
      <h2>Portable recovery</h2>
      <p>Download Markdown, metadata, media, and the current public projection.</p>
    </div>
    <form method="POST" action="/admin/export">
      <button type="submit">Export content</button>
    </form>
  </section>

  <section class="panel">
    <h2>New draft</h2>
    <form method="POST" action="?/create" class="new-draft-form">
      <label
        >Series<select name="series"
          >{#each data.series as series}<option value={series}>{series}</option>{/each}</select
        ></label
      >
      <label
        >Format<select name="format"
          >{#each data.formats as format}<option value={format}>{format}</option>{/each}</select
        ></label
      >
      <button class="primary-button" type="submit">Create draft</button>
    </form>
    {#if form?.message}<p class="form-error" role="alert">{form.message}</p>{/if}
  </section>

  <section class="drafts">
    <h2>Entries</h2>
    {#if data.posts.length === 0}
      <p>No drafts yet.</p>
    {:else}
      <ol class="draft-list">
        {#each data.posts as post}
          <li>
            <a href={`/admin/posts/${post.id}`}>
              <span>{post.title.trim() || "Untitled"}</span>
              <small
                >{post.series} · {post.format} · {post.status} · {new Date(
                  post.updatedAt,
                ).toLocaleString()}</small
              >
            </a>
          </li>
        {/each}
      </ol>
    {/if}
  </section>
</main>
