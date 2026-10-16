import { readFile, writeFile } from "node:fs/promises";

const path = new URL("../worker-configuration.d.ts", import.meta.url);
const generated = await readFile(path, "utf8");
const normalized = generated.replace(
  /\n\tinterface GlobalProps \{\n\t\tmainModule: typeof import\([^\n]+\);\n\t\}\n/u,
  "\n",
);

if (normalized === generated && generated.includes("interface GlobalProps")) {
  throw new Error("Wrangler's GlobalProps output changed; update the type normalizer");
}

await writeFile(path, normalized);
