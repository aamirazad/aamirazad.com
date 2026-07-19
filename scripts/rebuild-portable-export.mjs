import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve, sep } from "node:path";

const [, , archiveArgument, outputArgument] = process.argv;
if (!archiveArgument || !outputArgument) {
  console.error("Usage: pnpm rebuild:export -- <archive.tar> <new-output-directory>");
  process.exitCode = 1;
} else {
  await rebuild(resolve(archiveArgument), resolve(outputArgument));
}

async function rebuild(archivePath, outputRoot) {
  const bytes = new Uint8Array(await readFile(archivePath));
  const entries = parseTar(bytes);
  const manifestEntry = [...entries.entries()].find(([path]) => path.endsWith("/manifest.json"));
  if (!manifestEntry) throw new Error("Portable export manifest is missing");
  const manifest = JSON.parse(new TextDecoder().decode(manifestEntry[1]));
  if (
    manifest.schemaVersion !== 1 ||
    !Array.isArray(manifest.posts) ||
    !Array.isArray(manifest.objects)
  ) {
    throw new Error("Unsupported portable export schema");
  }

  await mkdir(outputRoot);
  for (const [archiveEntryPath, body] of entries) {
    if (
      !archiveEntryPath.includes("/posts/") &&
      !archiveEntryPath.endsWith("/README.md") &&
      !archiveEntryPath.endsWith("/manifest.json") &&
      !archiveEntryPath.endsWith("/schema-version.txt")
    )
      continue;
    await writeWithin(outputRoot, `source/${stripRoot(archiveEntryPath)}`, body);
  }
  for (const object of manifest.objects) {
    const body = entries.get(object.archivePath);
    if (!body || body.byteLength !== object.byteSize) {
      throw new Error(`Missing or invalid object: ${object.archivePath}`);
    }
    await writeWithin(outputRoot, `${object.target}/${object.r2Key}`, body);
  }
  for (const asset of manifest.assets) {
    const original = entries.get(asset.originalPath);
    if (!original || sha256(original) !== asset.sha256) {
      throw new Error(`Original media checksum failed: ${asset.id}`);
    }
  }
  await writeWithin(
    outputRoot,
    "restore-manifest.json",
    new TextEncoder().encode(`${JSON.stringify(manifest, null, 2)}\n`),
  );
  console.log(
    JSON.stringify({
      message: "portable export verified and rebuilt",
      posts: manifest.posts.length,
      assets: manifest.assets.length,
      objects: manifest.objects.length,
      output: outputRoot,
    }),
  );
}

function parseTar(bytes) {
  const entries = new Map();
  let offset = 0;
  while (offset + 512 <= bytes.byteLength) {
    const header = bytes.subarray(offset, offset + 512);
    if (header.every((value) => value === 0)) break;
    const name = readString(header, 0, 100);
    const prefix = readString(header, 345, 155);
    const path = prefix ? `${prefix}/${name}` : name;
    const size = Number.parseInt(readString(header, 124, 12).trim() || "0", 8);
    const start = offset + 512;
    const end = start + size;
    if (!safeRelative(path) || !Number.isSafeInteger(size) || size < 0 || end > bytes.byteLength) {
      throw new Error("Invalid portable TAR archive");
    }
    entries.set(path, bytes.slice(start, end));
    offset = end + ((512 - (size % 512)) % 512);
  }
  return entries;
}

async function writeWithin(root, relativePath, body) {
  if (!safeRelative(relativePath)) throw new Error(`Unsafe export path: ${relativePath}`);
  const destination = resolve(root, relativePath);
  if (!destination.startsWith(`${root}${sep}`))
    throw new Error(`Unsafe export path: ${relativePath}`);
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, body, { flag: "wx" });
}

function stripRoot(path) {
  return path.slice(path.indexOf("/") + 1);
}

function safeRelative(path) {
  return Boolean(path) && !path.startsWith("/") && !path.split("/").includes("..");
}

function readString(source, offset, length) {
  const field = source.subarray(offset, offset + length);
  const end = field.indexOf(0);
  return new TextDecoder().decode(end === -1 ? field : field.subarray(0, end));
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}
