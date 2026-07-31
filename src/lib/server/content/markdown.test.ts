import { describe, expect, it } from "vitest";

import { renderMarkdown } from "./markdown";

describe("Markdown rendering", () => {
  it("renders structured Markdown and removes unsafe HTML and protocols", async () => {
    const html = await renderMarkdown(
      [
        "# Heading one",
        "",
        "## Heading two",
        "",
        "A [safe link](https://example.com) with **strong**, *emphasized*, ~~deleted~~, and `code` text.",
        "",
        "- unordered",
        "  - nested",
        "",
        "1. ordered",
        "2. second",
        "",
        "- [x] complete",
        "- [ ] incomplete",
        "",
        "> A quotation",
        "",
        "| Name | Value |",
        "| --- | ---: |",
        "| one | 1 |",
        "",
        "```ts",
        "const structured = true;",
        "```",
        "",
        "---",
        "",
        "<script>alert(1)</script>",
        "",
        "[bad](javascript:alert(1))",
      ].join("\n"),
    );
    expect(html).toContain("<h1>Heading one</h1>");
    expect(html).toContain("<h2>Heading two</h2>");
    expect(html).toContain('<a href="https://example.com">safe link</a>');
    expect(html).toContain("<strong>strong</strong>");
    expect(html).toContain("<em>emphasized</em>");
    expect(html).toContain("<del>deleted</del>");
    expect(html).toContain("<ul>");
    expect(html).toContain("<ol>");
    expect(html).toContain('type="checkbox"');
    expect(html).toContain("<blockquote>");
    expect(html).toContain("<table>");
    expect(html).toContain('<code class="language-ts">');
    expect(html).toContain("<hr>");
    expect(html).not.toContain("script");
    expect(html).not.toContain("javascript:");
  });
});
