<script lang="ts">
  import ManageRedirectLinks from "$lib/components/admin/ManageRedirectLinks.svelte";
  import EditorBreadcrumbs from "$lib/components/EditorBreadcrumbs.svelte";

  let { data } = $props();
</script>

<header class="site-nav !mb-10 !items-start md:min-h-10">
  <EditorBreadcrumbs label="Redirects" href="/admin/redirects" accent="mint" />
</header>

<ManageRedirectLinks initialLinks={data.redirectLinks} />
