import { describe, expect, it } from "vitest";

import { canonicalRedirect } from "./canonical-origin";

describe("production canonical origin", () => {
  it("redirects www while preserving the path and query", () => {
    expect(
      canonicalRedirect(
        "https://www.aamirazad.com/on/example?ref=old",
        "https://aamirazad.com",
        "production",
      ),
    ).toBe("https://aamirazad.com/on/example?ref=old");
  });

  it("does not redirect canonical, preview, or local requests", () => {
    expect(
      canonicalRedirect("https://aamirazad.com/", "https://aamirazad.com", "production"),
    ).toBeNull();
    expect(
      canonicalRedirect(
        "https://preview.aamirazad.com/",
        "https://preview.aamirazad.com",
        "preview",
      ),
    ).toBeNull();
    expect(
      canonicalRedirect("http://127.0.0.1:5173/", "http://localhost:3000", "local"),
    ).toBeNull();
  });
});
