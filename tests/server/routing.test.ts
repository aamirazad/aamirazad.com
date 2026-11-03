import type { Cookies, RequestEvent } from "@sveltejs/kit";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { handle } from "../../src/hooks.server";
import { sessionCookieName } from "../../src/lib/server/auth/constants";
import { createSession } from "../../src/lib/server/auth/sessions";
import { createRedirectLink } from "../../src/lib/server/content/redirect-links";
import { setRuntimeEnvForTests, type RuntimeEnv } from "../../src/lib/server/env";
import { createTestEnv } from "./test-env";

let env: RuntimeEnv;

beforeEach(async () => {
  env = await createTestEnv();
  setRuntimeEnvForTests(env);
});

afterEach(() => setRuntimeEnvForTests(undefined));

function cookieJar(values: Record<string, string>): Cookies {
  return {
    get: (name: string) => values[name],
    getAll: () => Object.entries(values).map(([name, value]) => ({ name, value })),
    set: (name: string, value: string) => {
      values[name] = value;
    },
    delete: (name: string) => {
      delete values[name];
    },
    serialize: () => "",
  } as Cookies;
}

/** Run the server hook for a request, with `body` standing in for the rendered route. */
async function request(
  url: string,
  options: { method?: string; cookies?: Record<string, string>; body?: string } = {},
): Promise<Response> {
  const event = {
    url: new URL(url),
    request: new Request(url, { method: options.method ?? "GET" }),
    cookies: cookieJar({ ...options.cookies }),
    locals: {},
  } as unknown as RequestEvent;
  return handle({
    event,
    resolve: async () => new Response(options.body ?? "page", { status: 200 }),
  });
}

async function ownerCookie(): Promise<Record<string, string>> {
  const { token } = await createSession(env, "https://issuer.example", "owner");
  return { [sessionCookieName(new URL("https://aamirazad.com"))]: token };
}

describe("server routing", () => {
  it("moves private www requests to the apex without making the redirect cacheable", async () => {
    const response = await request("https://www.aamirazad.com/admin?from=www");

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://aamirazad.com/admin?from=www");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });

  it("sends signed-out visitors to login and rejects signed-out API calls", async () => {
    const page = await request("https://aamirazad.com/admin/posts");
    expect(page.status).toBe(303);
    expect(page.headers.get("location")).toBe(
      "https://aamirazad.com/auth/login?returnTo=%2Fadmin%2Fposts",
    );

    const api = await request("https://aamirazad.com/api/posts", { method: "GET" });
    expect(api.status).toBe(401);
  });

  it("opens the admin on its first section for a signed-in owner", async () => {
    const response = await request("https://aamirazad.com/admin", {
      cookies: await ownerCookie(),
    });

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://aamirazad.com/admin/create");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });

  it("tags public pages for Vercel's CDN and keeps private pages out of it", async () => {
    const post = await request("https://aamirazad.com/on/some-post");
    expect(post.headers.get("cache-control")).toMatch(/^public, max-age=60,/u);
    expect(post.headers.get("vercel-cdn-cache-control")).toMatch(/^public, max-age=3600,/u);
    expect(post.headers.get("vercel-cache-tag")).toBe("site,path-%2Fon%2Fsome-post,series-on");

    const admin = await request("https://aamirazad.com/admin/posts", {
      cookies: await ownerCookie(),
    });
    expect(admin.headers.get("cache-control")).toBe("private, no-store");
    expect(admin.headers.get("vercel-cdn-cache-control")).toBeNull();
  });

  it("follows editable redirect links without caching them", async () => {
    await createRedirectLink(
      env,
      { path: "/newsletter", targetUrl: "https://example.com/signup", label: "" },
      "owner",
    );
    const response = await request("https://aamirazad.com/newsletter");

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe("https://example.com/signup");
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("rejects cross-origin state changes", async () => {
    const response = await request("https://aamirazad.com/api/posts", {
      method: "POST",
      cookies: await ownerCookie(),
    });
    expect(response.status).toBe(403);
  });
});
