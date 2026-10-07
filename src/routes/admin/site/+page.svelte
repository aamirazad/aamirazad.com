<script lang="ts">
  import ManageSiteContent from "$lib/components/admin/ManageSiteContent.svelte";
  import EditorBreadcrumbs from "$lib/components/EditorBreadcrumbs.svelte";

  let { data } = $props();
</script>

<header class="site-nav !mb-10 !items-start md:min-h-10">
  <EditorBreadcrumbs label="Site" href="/admin/site" accent="violet" />
</header>

<ManageSiteContent initialItems={data.siteItems} />
