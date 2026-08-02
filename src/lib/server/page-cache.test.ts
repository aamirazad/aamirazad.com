import { version } from "$app/environment";
import { describe, expect, it } from "vitest";

import { publicPageEtag } from "$lib/server/page-cache";

describe("public page cache validators", () => {
  it("changes HTML ETags when the deployed application build changes", () => {
    expect(publicPageEtag("content-revision")).toBe(`"${version}-content-revision"`);
  });
});
