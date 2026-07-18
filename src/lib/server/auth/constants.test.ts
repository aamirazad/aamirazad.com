import { describe, expect, it } from "vitest";

import { oidcCookieName, safeReturnTo, sessionCookieName } from "./constants";

describe("authentication navigation", () => {
  it("only permits local administrative return paths", () => {
    expect(safeReturnTo("/admin/posts/new")).toBe("/admin/posts/new");
    expect(safeReturnTo("/preview/post-id")).toBe("/preview/post-id");
    expect(safeReturnTo("https://attacker.example/")).toBe("/admin");
    expect(safeReturnTo("//attacker.example/")).toBe("/admin");
    expect(safeReturnTo("/admin\\attacker.example")).toBe("/admin");
  });

  it("uses __Host cookies on HTTPS and development names on HTTP", () => {
    expect(sessionCookieName(new URL("https://example.com"))).toBe("__Host-publish-session");
    expect(oidcCookieName(new URL("https://example.com"))).toBe("__Host-publish-oidc");
    expect(sessionCookieName(new URL("http://localhost"))).toBe("publish-session");
  });
});
