import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { promisify } from "node:util";
import { describe, expect, test } from "vitest";

const execFileAsync = promisify(execFile);
const selector = resolve("scripts/select-cloudflare-environment.mjs");

describe("Cloudflare branch environment selection", () => {
  test.each([
    ["main", "production"],
    ["codex/publish-content", "preview"],
  ])("%s selects %s bindings", async (branch, environment) => {
    const directory = await mkdtemp(join(tmpdir(), "aamirazad-cloudflare-env-"));
    const envFile = join(directory, ".env");

    try {
      await writeFile(envFile, "KEEP=value\nCLOUDFLARE_ENV=stale\n", "utf8");
      await execFileAsync(process.execPath, [selector], {
        env: {
          ...process.env,
          CLOUDFLARE_BUILD_ENV_FILE: envFile,
          WORKERS_CI_BRANCH: branch,
        },
      });

      const result = await readFile(envFile, "utf8");
      expect(result).toContain("KEEP=value");
      expect(result.match(/^CLOUDFLARE_ENV=.*$/gm)).toEqual([`CLOUDFLARE_ENV=${environment}`]);
    } finally {
      await rm(directory, { force: true, recursive: true });
    }
  });
});
