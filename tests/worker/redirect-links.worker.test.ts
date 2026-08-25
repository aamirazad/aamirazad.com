import { applyD1Migrations, env, SELF } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";

import {
  createRedirectLink,
  deleteRedirectLink,
  listRedirectLinks,
  updateRedirectLink,
} from "$lib/server/content/redirect-links";

beforeEach(async () => {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
});

describe("redirect links", () => {
  it("creates, tracks, updates, and soft-deletes redirect links", async () => {
    const created = await createRedirectLink(
      env,
      { path: "/newsletter", targetUrl: "https://example.com/signup", label: "Newsletter" },
      "owner",
    );
    expect(created).not.toBe("path_taken");
    if (created === "path_taken") throw new Error("unexpected duplicate");

    const response = await SELF.fetch("https://aamirazad.com/newsletter", { redirect: "manual" });
    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe("https://example.com/signup");

    const [tracked] = await listRedirectLinks(env);
    expect(tracked).toMatchObject({ id: created.id, allTimeClicks: 1, last24HoursClicks: 1 });

    const updated = await updateRedirectLink(
      env,
      created.id,
      { path: "/newsletter", targetUrl: "https://example.com/new", label: "New", version: 1 },
      "owner",
    );
    expect(updated).toMatchObject({ targetUrl: "https://example.com/new", version: 2 });
    await expect(deleteRedirectLink(env, created.id, "owner")).resolves.toBe(true);
    await expect(listRedirectLinks(env)).resolves.toEqual([]);
  });

  it("does not allow two live redirects to claim the same path", async () => {
    await createRedirectLink(
      env,
      { path: "/one", targetUrl: "https://example.com", label: "" },
      "owner",
    );
    await expect(
      createRedirectLink(
        env,
        { path: "/one", targetUrl: "https://example.org", label: "" },
        "owner",
      ),
    ).resolves.toBe("path_taken");
  });
});
