import { gzipSync } from "node:zlib";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

const BUILD_ROOT = ".svelte-kit/cloudflare";
const CSS_BUDGET = 35 * 1024;
const PUBLIC_JS_BUDGET = 20 * 1024;

const cssFiles = await filesUnder(join(BUILD_ROOT, "_app/immutable/assets"), ".css");
if (cssFiles.length === 0) throw new Error("No built CSS was found. Run pnpm build first.");
const compressedCss = await compressedSize(cssFiles);

const rootOptions = await readFile("src/routes/+layout.ts", "utf8");
if (!/export const csr\s*=\s*false/u.test(rootOptions)) {
  throw new Error("Public routes must inherit csr = false so reading never requires JavaScript.");
}
const publicJavaScript = 0;

assertBudget("public route CSS", compressedCss, CSS_BUDGET);
assertBudget("required public JavaScript", publicJavaScript, PUBLIC_JS_BUDGET);
console.log(
  JSON.stringify({
    message: "public asset budgets passed",
    compressedCssBytes: compressedCss,
    requiredPublicJavaScriptBytes: publicJavaScript,
  }),
);

async function filesUnder(directory, extension) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await filesUnder(path, extension)));
    else if (entry.name.endsWith(extension)) files.push(path);
  }
  return files;
}

async function compressedSize(files) {
  let total = 0;
  for (const file of files) total += gzipSync(await readFile(file), { level: 9 }).byteLength;
  return total;
}

function assertBudget(label, actual, maximum) {
  if (actual > maximum) {
    throw new Error(`${label} is ${actual} bytes compressed; the budget is ${maximum} bytes.`);
  }
}
