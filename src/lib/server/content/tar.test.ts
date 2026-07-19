import { describe, expect, it } from "vitest";

import { createTarStream, parseTar, tarStreamToBytes, textTarEntry } from "./tar";

describe("portable TAR archives", () => {
  it("round-trips sorted files and ustar paths without filesystem-specific metadata", async () => {
    const longPath = `aamirazad-content-v1/posts/${"a".repeat(72)}/revisions/revision.md`;
    const bytes = await tarStreamToBytes(
      createTarStream([
        textTarEntry(longPath, "revision"),
        textTarEntry("aamirazad-content-v1/schema-version.txt", "1\n"),
      ]),
    );
    const parsed = parseTar(bytes);
    expect(new TextDecoder().decode(parsed.get(longPath))).toBe("revision");
    expect(new TextDecoder().decode(parsed.get("aamirazad-content-v1/schema-version.txt"))).toBe(
      "1\n",
    );
  });

  it("rejects paths that could escape during extraction", async () => {
    await expect(
      tarStreamToBytes(createTarStream([textTarEntry("../secret", "no")])),
    ).rejects.toThrow("Unsafe");
  });
});
