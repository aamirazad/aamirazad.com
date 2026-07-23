import { describe, expect, it } from "vitest";

import { atomFeed, jsonFeed, sitemap } from "./projection";

describe("empty public projection documents", () => {
  it("keeps feeds and the base sitemap valid before the first publication", () => {
    const origin = "https://aamirazad.com";
    expect(atomFeed(origin, [])).toContain('<feed xmlns="http://www.w3.org/2005/Atom">');
    expect(JSON.parse(jsonFeed(origin, []))).toMatchObject({
      home_page_url: `${origin}/`,
      items: [],
    });
    const emptySitemap = sitemap(origin, []);
    expect(emptySitemap).toContain(`<loc>${origin}/</loc>`);
    expect(emptySitemap).toContain(`<loc>${origin}/archive</loc>`);
  });
});
