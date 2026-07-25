import { applyD1Migrations, env } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";

import {
  createSiteItem,
  deleteSiteItem,
  listSiteItems,
  updateSiteItem,
} from "../../src/lib/server/content/site-items";

beforeEach(async () => {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
});

describe("homepage content storage", () => {
  it("seeds the existing projects, links, and homelab services in display order", async () => {
    const items = await listSiteItems(env);
    expect(items.filter((item) => item.kind === "project")).toHaveLength(14);
    expect(items.filter((item) => item.kind === "link")).toHaveLength(9);
    expect(items.filter((item) => item.kind === "homelab")).toHaveLength(13);
    expect(items[0]).toMatchObject({ kind: "project", name: "Terranaut", position: 0 });
  });

  it("creates, edits with optimistic concurrency, and soft-deletes items", async () => {
    const created = await createSiteItem(
      env,
      {
        kind: "link",
        name: "example",
        description: "",
        href: "https://example.com",
        github: "",
        codeUrl: "",
        badge: "",
        isWip: false,
      },
      "owner",
    );
    expect(created).toMatchObject({ name: "example", version: 1, position: 9 });

    const updated = await updateSiteItem(
      env,
      created.id,
      { ...created, name: "example edited" },
      "owner",
    );
    expect(updated).not.toBe("conflict");
    expect(updated).toMatchObject({ name: "example edited", version: 2 });
    await expect(
      updateSiteItem(env, created.id, { ...created, name: "stale edit" }, "owner"),
    ).resolves.toBe("conflict");

    await expect(deleteSiteItem(env, created.id, "owner")).resolves.toBe(true);
    await expect(deleteSiteItem(env, created.id, "owner")).resolves.toBe(false);
    await expect(listSiteItems(env)).resolves.not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: created.id })]),
    );
  });
});
