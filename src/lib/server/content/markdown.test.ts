import { describe, expect, it } from "vitest";

import { renderMarkdown } from "./markdown";

describe("Markdown rendering", () => {
  it("renders supported Markdown and removes unsafe HTML and protocols", async () => {
    const html = await renderMarkdown(
      "## Hello\n\n- one\n\n<script>alert(1)</script>\n\n[bad](javascript:alert(1))",
    );
    expect(html).toContain("<h2>Hello</h2>");
    expect(html).toContain("<li>one</li>");
    expect(html).not.toContain("script");
    expect(html).not.toContain("javascript:");
  });
});
