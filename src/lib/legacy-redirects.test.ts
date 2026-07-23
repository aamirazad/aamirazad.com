import { describe, expect, it } from "vitest";

import { legacyRedirectFor, legacyRedirects } from "./legacy-redirects";

describe("legacy redirects", () => {
  it("preserves the complete redirect baseline", () => {
    expect(Object.keys(legacyRedirects)).toHaveLength(30);
    expect(legacyRedirectFor("/github")).toBe("https://github.com/aamirazad/");
    expect(legacyRedirectFor("/pgp")).toBe("/.well-known/openpgpkey");
  });

  it("does not intercept content routes", () => {
    expect(legacyRedirectFor("/on/a-post")).toBeUndefined();
  });
});
