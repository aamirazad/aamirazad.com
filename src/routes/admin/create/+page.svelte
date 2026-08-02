<script lang="ts">
  import AdminPage from "../+page.svelte";

  let { data } = $props();
</script>

<AdminPage {data} view="create" />
