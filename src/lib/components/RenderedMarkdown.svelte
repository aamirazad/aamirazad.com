<script lang="ts">
  let { html }: { html: string } = $props();
</script>

<div class="rendered-markdown">{@html html}</div>

<style lang="postcss">
  @reference "../../app.css";

  .rendered-markdown {
    @apply min-w-0 text-[1.03rem] leading-[1.75] text-[#dcd2c9];
  }

  .rendered-markdown :global(:is(p, ul, ol, blockquote, pre, table, figure)) {
    @apply my-5;
  }

  .rendered-markdown :global(:is(h1, h2, h3, h4, h5, h6)) {
    @apply mt-10 mb-3 font-serif leading-[1.25] font-semibold tracking-[-0.02em] text-text normal-case;
    text-wrap: balance;
  }

  .rendered-markdown :global(h1) {
    @apply text-[clamp(1.75rem,4vw,2.25rem)];
  }

  .rendered-markdown :global(h2) {
    @apply text-[clamp(1.45rem,3vw,1.8rem)];
  }

  .rendered-markdown :global(h3) {
    @apply text-[1.3rem];
  }

  .rendered-markdown :global(h4) {
    @apply text-[1.12rem];
  }

  .rendered-markdown :global(h5) {
    @apply text-base;
  }

  .rendered-markdown :global(h6) {
    @apply font-sans text-sm tracking-[0.08em] text-soft uppercase;
  }

  .rendered-markdown :global(a) {
    color: var(--color-blue);
    font-weight: 550;
    overflow-wrap: anywhere;
    text-decoration-line: underline;
    text-decoration-color: color-mix(in srgb, var(--color-blue) 55%, transparent);
    text-decoration-thickness: 0.08em;
    text-underline-offset: 0.22em;
  }

  .rendered-markdown :global(a:visited) {
    color: var(--color-violet);
    text-decoration-color: color-mix(in srgb, var(--color-violet) 55%, transparent);
  }

  .rendered-markdown :global(a:hover) {
    @apply text-white;
    text-decoration-color: currentColor;
  }

  .rendered-markdown :global(:is(strong, b)) {
    @apply font-semibold text-text;
  }

  .rendered-markdown :global(:is(del, s)) {
    @apply text-soft;
  }

  .rendered-markdown :global(:is(ul, ol)) {
    padding-inline-start: 1.65rem;
  }

  .rendered-markdown :global(ul) {
    list-style-type: disc;
  }

  .rendered-markdown :global(ol) {
    list-style-type: decimal;
  }

  .rendered-markdown :global(ul ul) {
    list-style-type: circle;
  }

  .rendered-markdown :global(ul ul ul) {
    list-style-type: square;
  }

  .rendered-markdown :global(ol ol) {
    list-style-type: lower-alpha;
  }

  .rendered-markdown :global(:is(ul, ol) :is(ul, ol)) {
    @apply my-2;
  }

  .rendered-markdown :global(li) {
    padding-inline-start: 0.25rem;
  }

  .rendered-markdown :global(li + li) {
    @apply mt-1.5;
  }

  .rendered-markdown :global(li::marker) {
    @apply font-semibold text-blue;
  }

  .rendered-markdown :global(li > :is(p, ul, ol)) {
    @apply my-2;
  }

  .rendered-markdown :global(.contains-task-list) {
    @apply list-none;
    padding-inline-start: 0;
  }

  .rendered-markdown :global(.task-list-item) {
    @apply list-none;
    padding-inline-start: 0;
  }

  .rendered-markdown :global(input[type="checkbox"]) {
    @apply mr-2 inline-block min-h-0 w-4 rounded-sm p-0 align-[-0.1em];
    accent-color: var(--color-blue);
  }

  .rendered-markdown :global(blockquote) {
    @apply rounded-r-lg border-l-blue bg-[rgb(255_248_242_/_5%)] px-5 py-3;
  }

  .rendered-markdown :global(blockquote > :first-child) {
    @apply mt-0;
  }

  .rendered-markdown :global(blockquote > :last-child) {
    @apply mb-0;
  }

  .rendered-markdown :global(hr) {
    @apply my-10 border-0 border-t border-[rgb(255_240_230_/_10%)];
  }

  .rendered-markdown :global(pre) {
    @apply overflow-x-auto rounded-lg bg-[rgb(6_4_4_/_45%)] p-4 text-[0.9rem] leading-[1.65] text-[#dedede];
    tab-size: 2;
  }

  .rendered-markdown :global(code) {
    font-family:
      ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
  }

  .rendered-markdown :global(pre code) {
    @apply border-0 bg-transparent p-0 text-inherit;
  }

  .rendered-markdown :global(:not(pre) > code) {
    @apply rounded-sm bg-[rgb(255_248_242_/_8%)] px-[0.35rem] py-[0.12rem] text-[0.88em] text-amber;
    overflow-wrap: anywhere;
  }

  .rendered-markdown :global(table) {
    @apply w-full max-w-full rounded-lg border border-[rgb(255_240_230_/_10%)] text-[0.92rem];
    border-collapse: separate;
    border-spacing: 0;
    table-layout: auto;
  }

  .rendered-markdown :global(:is(th, td)) {
    @apply border-r border-b border-[rgb(255_240_230_/_10%)] px-3.5 py-2.5 text-left align-top;
    overflow-wrap: anywhere;
  }

  .rendered-markdown :global(th) {
    @apply bg-[rgb(255_248_242_/_7%)] font-semibold text-text;
  }

  .rendered-markdown :global(tr:nth-child(even) td) {
    @apply bg-[rgb(255_248_242_/_3%)];
  }

  .rendered-markdown :global(:is(th, td):last-child) {
    @apply border-r-0;
  }

  .rendered-markdown :global(tbody tr:last-child td) {
    @apply border-b-0;
  }

  .rendered-markdown :global(img) {
    @apply block h-auto max-w-full rounded-lg bg-[rgb(255_248_242_/_5%)];
  }

  .rendered-markdown :global(sup) {
    @apply text-[0.75em] leading-none;
  }

  .rendered-markdown :global(.footnotes) {
    @apply mt-12 border-t border-[rgb(255_240_230_/_10%)] pt-5 text-[0.9rem];
  }

  .rendered-markdown :global(.footnotes ol) {
    @apply my-0;
  }

  .rendered-markdown :global(.data-footnote-backref) {
    @apply ml-1 no-underline;
  }

  .rendered-markdown :global(.sr-only) {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  .rendered-markdown :global(> :first-child) {
    @apply mt-0;
  }

  .rendered-markdown :global(> :last-child) {
    @apply mb-0;
  }
</style>
