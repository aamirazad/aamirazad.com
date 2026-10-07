<script lang="ts">
  import PostEditor from "$lib/components/admin/PostEditor.svelte";

  let { data } = $props();
</script>

{#key data.post.id}
  <PostEditor post={data.post} hasUnpublishedChanges={data.hasUnpublishedChanges} />
{/key}
