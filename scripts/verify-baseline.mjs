import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const redirects = JSON.parse(
  await readFile(new URL("../baseline/legacy-redirects.json", import.meta.url), "utf8"),
);
const publicSurface = JSON.parse(
  await readFile(new URL("../baseline/public-surface.json", import.meta.url), "utf8"),
);

const paths = Object.keys(redirects);
assert.equal(paths.length, 30, "the legacy redirect inventory changed unexpectedly");
assert.equal(new Set(paths).size, paths.length, "legacy redirect paths must be unique");

for (const [path, destination] of Object.entries(redirects)) {
  assert.match(path, /^\/[A-Za-z0-9._~!$&'()*+,;=:@%/-]+$/, `${path} is not a safe route path`);
  assert.ok(
    destination.startsWith("https://") || destination.startsWith("/"),
    `${path} must redirect to HTTPS or a root-relative path`,
  );
  assert.notEqual(path, destination, `${path} redirects to itself`);
}

assert.equal(publicSurface.canonicalOrigin, "https://aamirazad.com");
assert.deepEqual(publicSurface.homepageHeadings, ["Aamir Azad", "Contact", "Projects", "Homelab"]);
assert.ok(publicSurface.staticRoutes.includes("/.well-known/openpgpkey"));

console.log(
  `Baseline verified: ${paths.length} redirects and ${publicSurface.staticRoutes.length} static routes.`,
);
