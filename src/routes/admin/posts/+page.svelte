<script lang="ts">
  import ManagePosts from "$lib/components/admin/ManagePosts.svelte";
  import EditorBreadcrumbs from "$lib/components/EditorBreadcrumbs.svelte";

  let { data } = $props();
</script>

<header class="site-nav !mb-10 !items-start md:min-h-10">
  <EditorBreadcrumbs label="Posts" href="/admin/posts" accent="blue" />
</header>

<ManagePosts initialPosts={data.posts} />
