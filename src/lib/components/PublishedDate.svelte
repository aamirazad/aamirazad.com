<script lang="ts">
  import { publishedPostWasEdited } from "$lib/published";

  let {
    publishedAt,
    modifiedAt,
    emphasized = false,
    showLabel = true,
  }: {
    publishedAt: string;
    modifiedAt: string;
    emphasized?: boolean;
    showLabel?: boolean;
  } = $props();

  const formatDate = (value: string) =>
    new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "UTC" }).format(
      new Date(value),
    );
</script>

<span class="whitespace-nowrap text-[0.8rem] text-soft">
  {#if showLabel}Published
  {:else}<span class="sr-only">Published </span>{/if}<time
    class:text-[0.85rem]={emphasized}
    datetime={publishedAt}
    title={`Published ${formatDate(publishedAt)}`}>{formatDate(publishedAt)}</time
  >{#if publishedPostWasEdited({ publishedAt, modifiedAt })}<abbr
      class="ml-[0.14rem] cursor-help text-amber no-underline"
      title={`Edited ${formatDate(modifiedAt)}`}
      aria-label={`; edited ${formatDate(modifiedAt)}`}>*</abbr
    >{/if}
</span>
