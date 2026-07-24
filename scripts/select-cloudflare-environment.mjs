import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const branch = process.env.WORKERS_CI_BRANCH?.trim();

if (!branch) {
  process.exit(0);
}

const environment = branch === "main" ? "production" : "preview";
const envFile = resolve(process.env.CLOUDFLARE_BUILD_ENV_FILE ?? ".env");

let current = "";
try {
  current = await readFile(envFile, "utf8");
} catch (cause) {
  if (cause?.code !== "ENOENT") throw cause;
}

const newline = current.includes("\r\n") ? "\r\n" : "\n";
const withoutSelection = current.replace(/^(?:export\s+)?CLOUDFLARE_ENV\s*=.*(?:\r?\n|$)/gm, "");
const separator =
  withoutSelection.length === 0 || withoutSelection.endsWith(newline) ? "" : newline;

await writeFile(
  envFile,
  `${withoutSelection}${separator}CLOUDFLARE_ENV=${environment}${newline}`,
  "utf8",
);

console.log(`Cloudflare build branch ${branch} selected the ${environment} Wrangler environment.`);
