import { describe, expect, it } from "vitest";

import { fetchLinkMetadata, isPrivateAddress } from "./link-metadata";

describe("link metadata SSRF protection", () => {
  it("rejects local and private network destinations", () => {
    expect(isPrivateAddress("127.0.0.1")).toBe(true);
    expect(isPrivateAddress("10.1.2.3")).toBe(true);
    expect(isPrivateAddress("fd00::1")).toBe(true);
    expect(isPrivateAddress("203.0.113.5")).toBe(true);
    expect(isPrivateAddress("93.184.216.34")).toBe(false);
  });

  it("resolves public hosts and extracts bounded metadata", async () => {
    const mockFetch: typeof fetch = async (input) => {
      const url = new URL(input instanceof Request ? input.url : input.toString());
      if (url.hostname === "cloudflare-dns.com") {
        const type = url.searchParams.get("type");
        return Response.json({ Answer: type === "A" ? [{ type: 1, data: "93.184.216.34" }] : [] });
      }
      return new Response(
        `<html><head><meta property="og:title" content="A &amp; B"><meta name="description" content="Useful page"><title>Fallback</title></head></html>`,
        { headers: { "content-type": "text/html" } },
      );
    };
    await expect(fetchLinkMetadata("https://example.com/post", mockFetch)).resolves.toMatchObject({
      url: "https://example.com/post",
      title: "A & B",
      description: "Useful page",
    });
  });

  it("revalidates redirect targets", async () => {
    const mockFetch: typeof fetch = async (input) => {
      const url = new URL(input instanceof Request ? input.url : input.toString());
      if (url.hostname === "cloudflare-dns.com")
        return Response.json({ Answer: [{ type: 1, data: "93.184.216.34" }] });
      return new Response(null, { status: 302, headers: { location: "http://127.0.0.1/private" } });
    };
    await expect(fetchLinkMetadata("https://example.com", mockFetch)).rejects.toThrow(
      "Private network",
    );
  });
});
