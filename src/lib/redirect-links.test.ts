import { describe, expect, it } from "vitest";

import { validateRedirectLinkInput } from "./redirect-links";

const link = (path: string, targetUrl: string) => ({ path, targetUrl, label: "" });

describe("redirect link validation", () => {
  it("accepts public URLs and paths on this site", () => {
    expect(validateRedirectLinkInput(link("/github", "https://github.com/aamirazad/"))).toBeNull();
    expect(validateRedirectLinkInput(link("/pgp", "/.well-known/openpgpkey"))).toBeNull();
  });

  it("rejects reserved paths, loops, and unsafe destinations", () => {
    expect(validateRedirectLinkInput(link("/admin/x", "https://example.com"))).not.toBeNull();
    expect(validateRedirectLinkInput(link("/loop", "/loop"))).not.toBeNull();
    expect(validateRedirectLinkInput(link("/x", "//evil.example"))).not.toBeNull();
    expect(validateRedirectLinkInput(link("/x", "javascript:alert(1)"))).not.toBeNull();
  });
});
