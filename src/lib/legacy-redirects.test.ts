import { describe, expect, it } from "vitest";

import { legacyRedirectFor } from "./legacy-redirects";

describe("legacy redirects", () => {
  it("preserves the complete redirect baseline", () => {
    expect(legacyRedirectFor("/github")).toBe("https://github.com/aamirazad/");
    expect(legacyRedirectFor("/pgp")).toBe("/.well-known/openpgpkey");
  });

  it("does not intercept content routes", () => {
    expect(legacyRedirectFor("/on/a-post")).toBeUndefined();
  });
});
