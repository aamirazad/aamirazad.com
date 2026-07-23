const BLOCK_SIZE = 512;
const encoder = new TextEncoder();
const decoder = new TextDecoder();

export type TarEntry = {
  path: string;
  size: number;
  open: () => Promise<ReadableStream<Uint8Array>>;
};

export function textTarEntry(path: string, value: string): TarEntry {
  const bytes = encoder.encode(value);
  return {
    path,
    size: bytes.byteLength,
    open: async () => new Blob([bytes]).stream(),
  };
}

export function createTarStream(entries: TarEntry[]): ReadableStream<Uint8Array> {
  const ordered = entries.toSorted((left, right) => left.path.localeCompare(right.path));
  const iterator = tarChunks(ordered);
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const next = await iterator.next();
        if (next.done) controller.close();
        else controller.enqueue(next.value);
      } catch (caught) {
        controller.error(caught);
      }
    },
    async cancel() {
      await iterator.return(undefined);
    },
  });
}

async function* tarChunks(entries: TarEntry[]): AsyncGenerator<Uint8Array> {
  for (const entry of entries) {
    yield tarHeader(entry.path, entry.size);
    const reader = (await entry.open()).getReader();
    let written = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        written += value.byteLength;
        if (written > entry.size) throw new Error(`Archive entry exceeded its size: ${entry.path}`);
        yield value;
      }
    } finally {
      reader.releaseLock();
    }
    if (written !== entry.size)
      throw new Error(`Archive entry changed during export: ${entry.path}`);
    const padding = paddingFor(entry.size);
    if (padding) yield new Uint8Array(padding);
  }
  yield new Uint8Array(BLOCK_SIZE * 2);
}

export async function tarStreamToBytes(stream: ReadableStream<Uint8Array>): Promise<Uint8Array> {
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

export function parseTar(bytes: Uint8Array): Map<string, Uint8Array> {
  const entries = new Map<string, Uint8Array>();
  let offset = 0;
  while (offset + BLOCK_SIZE <= bytes.byteLength) {
    const header = bytes.subarray(offset, offset + BLOCK_SIZE);
    if (header.every((value) => value === 0)) break;
    const name = readString(header, 0, 100);
    const prefix = readString(header, 345, 155);
    const path = prefix ? `${prefix}/${name}` : name;
    const size = Number.parseInt(readString(header, 124, 12).trim() || "0", 8);
    if (!Number.isSafeInteger(size) || size < 0) throw new Error(`Invalid TAR size for ${path}`);
    const start = offset + BLOCK_SIZE;
    const end = start + size;
    if (!path || end > bytes.byteLength) throw new Error("Truncated or invalid TAR archive");
    entries.set(path, bytes.slice(start, end));
    offset = end + paddingFor(size);
  }
  return entries;
}

function tarHeader(path: string, size: number): Uint8Array {
  if (!Number.isSafeInteger(size) || size < 0) throw new Error(`Invalid archive size: ${path}`);
  const { name, prefix } = splitTarPath(path);
  const header = new Uint8Array(BLOCK_SIZE);
  writeString(header, 0, 100, name);
  writeOctal(header, 100, 8, 0o644);
  writeOctal(header, 108, 8, 0);
  writeOctal(header, 116, 8, 0);
  writeOctal(header, 124, 12, size);
  writeOctal(header, 136, 12, 0);
  header.fill(0x20, 148, 156);
  header[156] = 0x30;
  writeString(header, 257, 6, "ustar");
  writeString(header, 263, 2, "00");
  writeString(header, 345, 155, prefix);
  const checksum = header.reduce((total, value) => total + value, 0);
  const checksumText = checksum.toString(8).padStart(6, "0");
  writeString(header, 148, 6, checksumText);
  header[154] = 0;
  header[155] = 0x20;
  return header;
}

function splitTarPath(path: string): { name: string; prefix: string } {
  if (!path || path.startsWith("/") || path.includes(".."))
    throw new Error(`Unsafe archive path: ${path}`);
  if (encoder.encode(path).byteLength <= 100) return { name: path, prefix: "" };
  for (let index = path.lastIndexOf("/"); index > 0; index = path.lastIndexOf("/", index - 1)) {
    const prefix = path.slice(0, index);
    const name = path.slice(index + 1);
    if (encoder.encode(prefix).byteLength <= 155 && encoder.encode(name).byteLength <= 100) {
      return { name, prefix };
    }
  }
  throw new Error(`Archive path is too long: ${path}`);
}

function writeString(target: Uint8Array, offset: number, length: number, value: string): void {
  const bytes = encoder.encode(value);
  if (bytes.byteLength > length) throw new Error(`TAR field is too long: ${value}`);
  target.set(bytes, offset);
}

function writeOctal(target: Uint8Array, offset: number, length: number, value: number): void {
  writeString(target, offset, length, `${value.toString(8).padStart(length - 1, "0")}\0`);
}

function readString(source: Uint8Array, offset: number, length: number): string {
  const field = source.subarray(offset, offset + length);
  const end = field.indexOf(0);
  return decoder.decode(end === -1 ? field : field.subarray(0, end));
}

function paddingFor(size: number): number {
  return (BLOCK_SIZE - (size % BLOCK_SIZE)) % BLOCK_SIZE;
}
