import type { PublishedPost } from "$lib/published";

export function atomFeed(origin: string, posts: PublishedPost[]): string {
  const updated = posts[0]?.modifiedAt ?? new Date(0).toISOString();
  return `<?xml version="1.0" encoding="utf-8"?><feed xmlns="http://www.w3.org/2005/Atom"><id>${xml(origin)}/</id><title>Aamir Azad</title><updated>${updated}</updated><link href="${xml(origin)}/feed.xml" rel="self"/>${posts.map((post) => `<entry><id>${xml(origin + post.canonicalPath)}</id><title>${xml(post.title)}</title><link href="${xml(origin + post.canonicalPath)}"/><published>${post.publishedAt}</published><updated>${post.modifiedAt}</updated><summary>${xml(post.summary)}</summary><content type="html">${xml(post.html)}</content></entry>`).join("")}</feed>`;
}

export function jsonFeed(origin: string, posts: PublishedPost[]): string {
  return JSON.stringify({
    version: "https://jsonfeed.org/version/1.1",
    title: "Aamir Azad",
    home_page_url: `${origin}/`,
    feed_url: `${origin}/feed.json`,
    items: posts.map((post) => ({
      id: `${origin}${post.canonicalPath}`,
      url: `${origin}${post.canonicalPath}`,
      title: post.title,
      summary: post.summary,
      content_html: post.html,
      date_published: post.publishedAt,
      date_modified: post.modifiedAt,
    })),
  });
}

export function sitemap(origin: string, posts: PublishedPost[]): string {
  const paths = [
    "/",
    "/on",
    "/today",
    "/built",
    "/found",
    "/archive",
    ...posts.map((post) => post.canonicalPath),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map((path) => `<url><loc>${xml(origin + path)}</loc></url>`).join("")}</urlset>`;
}

function xml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
