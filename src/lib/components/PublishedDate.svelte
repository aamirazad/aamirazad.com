<script lang="ts">
  import { publishedPostWasEdited } from "$lib/published";

  let {
    publishedAt,
    modifiedAt,
    emphasized = false,
  }: { publishedAt: string; modifiedAt: string; emphasized?: boolean } = $props();

  const formatDate = (value: string) =>
    new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "UTC" }).format(
      new Date(value),
    );
</script>

<span class="text-[0.8rem] text-soft">
  Published <time class:text-[0.85rem]={emphasized} datetime={publishedAt}
    >{formatDate(publishedAt)}</time
  >{#if publishedPostWasEdited({ publishedAt, modifiedAt })}<abbr
      class="ml-[0.14rem] cursor-help text-amber no-underline"
      title={`Edited ${formatDate(modifiedAt)}`}
      aria-label={`; edited ${formatDate(modifiedAt)}`}>*</abbr
    >{/if}
</span>
