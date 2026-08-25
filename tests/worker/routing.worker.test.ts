import { applyD1Migrations, env, SELF } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";

import { sessionCookieName } from "$lib/server/auth/constants";
import { createSession } from "$lib/server/auth/sessions";

beforeEach(async () => {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
});

describe("production host routing", () => {
  it("serves public pages on the apex and www with apex canonical metadata", async () => {
    const [apex, www] = await Promise.all([
      SELF.fetch("https://aamirazad.com/", { redirect: "manual" }),
      SELF.fetch("https://www.aamirazad.com/", { redirect: "manual" }),
    ]);

    expect(apex.status).toBe(200);
    expect(www.status).toBe(200);
    expect(await apex.text()).toContain('<link rel="canonical" href="https://aamirazad.com/"');
    expect(await www.text()).toContain('<link rel="canonical" href="https://aamirazad.com/"');
  });

  it("moves private www requests to the apex without making the redirect cacheable", async () => {
    const response = await SELF.fetch("https://www.aamirazad.com/admin?from=www", {
      redirect: "manual",
    });

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://aamirazad.com/admin?from=www");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });

  it("gives each admin section its own URL and matching breadcrumb", async () => {
    const { token } = await createSession(env, "https://issuer.example", "owner");
    const origin = new URL("https://aamirazad.com");
    const headers = { cookie: `${sessionCookieName(origin)}=${token}` };
    const root = await SELF.fetch("https://aamirazad.com/admin", {
      headers,
      redirect: "manual",
    });

    expect(root.status).toBe(307);
    expect(root.headers.get("location")).toBe("https://aamirazad.com/admin/create");

    for (const section of ["create", "posts", "site", "redirects"] as const) {
      const response = await SELF.fetch(`https://aamirazad.com/admin/${section}`, { headers });
      const html = await response.text();
      const label = section.charAt(0).toUpperCase() + section.slice(1);

      expect(response.status).toBe(200);
      expect(html).toContain(`href="/admin/${section}" aria-current="page"`);
      expect(html).toMatch(
        new RegExp(
          `aria-label="Breadcrumb"[\\s\\S]*href="/admin/${section}"[\\s\\S]*>\\s*${label}</a>`,
        ),
      );
    }
  });

  it("caches only immutable assets that actually exist", async () => {
    const page = await SELF.fetch("https://aamirazad.com/");
    const html = await page.text();
    const entrypoint = html.match(
      /import\("(\.\/_app\/immutable\/entry\/start\.[^"]+\.js)"\)/,
    )?.[1];

    expect(entrypoint).toBeTruthy();

    const [existing, missing] = await Promise.all([
      SELF.fetch(new URL(entrypoint!, "https://aamirazad.com/")),
      SELF.fetch("https://aamirazad.com/_app/immutable/entry/missing.js"),
    ]);

    expect(existing.status).toBe(200);
    expect(existing.headers.get("cache-control")).toBe("public, max-age=31536000, immutable");
    expect(existing.headers.get("cloudflare-cdn-cache-control")).toBe(
      "public, max-age=31536000, immutable",
    );

    expect(missing.status).toBe(404);
    expect(missing.headers.get("cache-control")).toBe("no-store");
    expect(missing.headers.get("cloudflare-cdn-cache-control")).toBe("no-store");
  });
});
