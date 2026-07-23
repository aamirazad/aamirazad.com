import { readFile, writeFile } from "node:fs/promises";

const path = new URL("../worker-configuration.d.ts", import.meta.url);
const generated = await readFile(path, "utf8");
const withoutGlobalProps = generated.replace(
  /\n\tinterface GlobalProps \{\n\t\tmainModule: typeof import\([^\n]+\);\n\t\}\n/u,
  "\n",
);
const normalized = withoutGlobalProps.replaceAll(
  /Workflow<Parameters<import\("\.\/worker"\)\.PublishWorkflow\['run'\]>\[0\]\['payload'\]>/gu,
  "Workflow<{ jobId: string }>",
);

if (withoutGlobalProps === generated && generated.includes("interface GlobalProps")) {
  throw new Error("Wrangler's GlobalProps output changed; update the type normalizer");
}

if (normalized.includes('import("./worker")')) {
  throw new Error("Wrangler's Workflow binding output changed; update the type normalizer");
}

await writeFile(path, normalized);
