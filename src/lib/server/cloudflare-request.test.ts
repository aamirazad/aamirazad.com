import { describe, expect, it } from "vitest";

import { oidcRedirectOrigin } from "./auth/oidc";
import { normalizeWorkersDevRequestProtocol } from "./cloudflare-request";

const previewUrl =
  "http://codex-fix-security-issues-aamirazad-com.aamirazad.workers.dev/auth/login?returnTo=%2Fadmin";

describe("normalizeWorkersDevRequestProtocol", () => {
  it("uses X-Forwarded-Proto to restore HTTPS for Workers preview URLs", () => {
    const request = new Request(previewUrl, {
      headers: { "x-forwarded-proto": "https" },
    });

    const normalized = normalizeWorkersDevRequestProtocol(request);

    expect(normalized.url).toBe(
      "https://codex-fix-security-issues-aamirazad-com.aamirazad.workers.dev/auth/login?returnTo=%2Fadmin",
    );
    expect(
      `${oidcRedirectOrigin("https://aamirazad.com", new URL(normalized.url))}/auth/callback`,
    ).toBe("https://codex-fix-security-issues-aamirazad-com.aamirazad.workers.dev/auth/callback");
  });

  it("falls back to the HTTPS scheme in CF-Visitor", () => {
    const request = new Request(previewUrl, {
      headers: { "cf-visitor": JSON.stringify({ scheme: "https" }) },
    });

    expect(normalizeWorkersDevRequestProtocol(request).url).toMatch(/^https:/);
  });

  it("keeps the original request when Cloudflare does not report external HTTPS", () => {
    const request = new Request(previewUrl, {
      headers: {
        "cf-visitor": "not-json",
        "x-forwarded-proto": "http",
      },
    });

    expect(normalizeWorkersDevRequestProtocol(request)).toBe(request);
  });

  it("does not rewrite non-Workers URLs", () => {
    const request = new Request("http://localhost:3000/auth/login", {
      headers: { "x-forwarded-proto": "https" },
    });

    expect(normalizeWorkersDevRequestProtocol(request)).toBe(request);
  });
});
