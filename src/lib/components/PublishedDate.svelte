<script lang="ts">
  import { publishedPostWasEdited } from "$lib/published";

  let { publishedAt, modifiedAt }: { publishedAt: string; modifiedAt: string } = $props();

  const formatDate = (value: string) =>
    new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "UTC" }).format(
      new Date(value),
    );
</script>

<span class="published-date">
  Published <time datetime={publishedAt}>{formatDate(publishedAt)}</time
  >{#if publishedPostWasEdited({ publishedAt, modifiedAt })}<abbr
      class="edited-marker"
      title={`Edited ${formatDate(modifiedAt)}`}
      aria-label={`; edited ${formatDate(modifiedAt)}`}>*</abbr
    >{/if}
</span>
