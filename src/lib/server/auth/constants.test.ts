import { describe, expect, it } from "vitest";

import { oidcCookieName, safeReturnTo, sessionCookieName } from "./constants";
import { oidcRedirectOrigin } from "./oidc";

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

  it("keeps local and Vercel preview callbacks on the origin being visited", () => {
    const production = "https://aamirazad.com";
    expect(oidcRedirectOrigin(production, new URL("http://localhost:3000/admin"))).toBe(
      "http://localhost:3000",
    );
    expect(oidcRedirectOrigin(production, new URL("http://127.0.0.1:3000/admin"))).toBe(
      "http://127.0.0.1:3000",
    );
    expect(
      oidcRedirectOrigin(
        production,
        new URL("https://aamirazad-com-git-branch-aamira.vercel.app/admin"),
      ),
    ).toBe("https://aamirazad-com-git-branch-aamira.vercel.app");
    expect(oidcRedirectOrigin(production, new URL("https://www.aamirazad.com/admin"))).toBe(
      production,
    );
  });
});
