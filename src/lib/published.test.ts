import { describe, expect, it } from "vitest";

import { publishedPostWasEdited } from "$lib/published";

describe("published post dates", () => {
  it("marks only revisions created after initial publication as edited", () => {
    expect(
      publishedPostWasEdited({
        publishedAt: "2026-07-19T12:00:00.000Z",
        modifiedAt: "2026-07-19T11:59:59.000Z",
      }),
    ).toBe(false);
    expect(
      publishedPostWasEdited({
        publishedAt: "2026-07-19T12:00:00.000Z",
        modifiedAt: "2026-07-20T12:00:00.000Z",
      }),
    ).toBe(true);
  });
});
