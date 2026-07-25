import { applyD1Migrations, env, SELF } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";

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
});
