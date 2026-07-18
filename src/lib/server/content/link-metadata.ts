const MAX_BYTES = 512 * 1024;
const MAX_REDIRECTS = 4;

export type LinkMetadata = { url: string; title: string; description: string; imageUrl: string };

type DnsAnswer = { data?: string; type?: number };
type DnsResponse = { Answer?: DnsAnswer[] };

export async function fetchLinkMetadata(
  rawUrl: string,
  fetcher: typeof fetch = fetch,
): Promise<LinkMetadata> {
  let url = parsePublicUrl(rawUrl);
  for (let redirect = 0; redirect <= MAX_REDIRECTS; redirect += 1) {
    await assertPublicDestination(url, fetcher);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8_000);
    let response: Response;
    try {
      response = await fetcher(url, {
        redirect: "manual",
        signal: controller.signal,
        headers: {
          accept: "text/html,application/xhtml+xml;q=0.9",
          "user-agent": "aamirazad.com link preview",
        },
      });
    } finally {
      clearTimeout(timeout);
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location || redirect === MAX_REDIRECTS)
        throw new Error("The URL redirected too many times.");
      url = parsePublicUrl(new URL(location, url).href);
      continue;
    }
    if (!response.ok) throw new Error(`The URL returned HTTP ${response.status}.`);
    const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) {
      throw new Error("The URL did not return an HTML page.");
    }
    const declaredLength = Number(response.headers.get("content-length") ?? 0);
    if (declaredLength > MAX_BYTES) throw new Error("The page is too large to preview.");
    const html = await readBoundedText(response, MAX_BYTES);
    return extractMetadata(url, html);
  }
  throw new Error("The URL could not be previewed.");
}

async function assertPublicDestination(url: URL, fetcher: typeof fetch): Promise<void> {
  if (url.port && url.port !== "80" && url.port !== "443")
    throw new Error("Only standard web ports are allowed.");
  if (isPrivateAddress(url.hostname))
    throw new Error("Private network destinations are not allowed.");
  const answers = await Promise.all([
    resolve(url.hostname, "A", fetcher),
    resolve(url.hostname, "AAAA", fetcher),
  ]);
  const addresses = answers.flat();
  if (addresses.length === 0 || addresses.some(isPrivateAddress)) {
    throw new Error("The URL does not resolve to a public address.");
  }
}

async function resolve(
  hostname: string,
  type: "A" | "AAAA",
  fetcher: typeof fetch,
): Promise<string[]> {
  if (isIpLiteral(hostname)) return [hostname.replace(/^\[|\]$/gu, "")];
  const endpoint = new URL("https://cloudflare-dns.com/dns-query");
  endpoint.searchParams.set("name", hostname);
  endpoint.searchParams.set("type", type);
  const response = await fetcher(endpoint, {
    headers: { accept: "application/dns-json" },
    redirect: "error",
  });
  if (!response.ok) throw new Error("The destination hostname could not be verified.");
  const data = await response.json<DnsResponse>();
  return (data.Answer ?? [])
    .filter((answer) => answer.type === (type === "A" ? 1 : 28) && answer.data)
    .map((answer) => String(answer.data));
}

function parsePublicUrl(rawUrl: string): URL {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("Enter a complete HTTP or HTTPS URL.");
  }
  if ((url.protocol !== "https:" && url.protocol !== "http:") || url.username || url.password) {
    throw new Error("Only public HTTP and HTTPS URLs without credentials are allowed.");
  }
  return url;
}

function isIpLiteral(hostname: string): boolean {
  return /^\d{1,3}(?:\.\d{1,3}){3}$/u.test(hostname) || hostname.includes(":");
}

export function isPrivateAddress(raw: string): boolean {
  const value = raw
    .toLowerCase()
    .replace(/^\[|\]$/gu, "")
    .replace(/\.$/u, "");
  if (
    ["localhost", "0.0.0.0", "::", "::1"].includes(value) ||
    value.endsWith(".localhost") ||
    value.endsWith(".local")
  )
    return true;
  const ipv4 = value.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/u);
  if (ipv4) {
    const parts = ipv4.slice(1).map(Number);
    if (parts.some((part) => part > 255)) return true;
    const [a, b] = parts;
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 0) ||
      (a === 192 && b === 2) ||
      (a === 192 && b === 168) ||
      (a === 198 && (b === 18 || b === 19 || b === 51)) ||
      (a === 203 && b === 0) ||
      (a === 100 && b >= 64 && b <= 127) ||
      a >= 224
    );
  }
  return (
    value.startsWith("fc") ||
    value.startsWith("fd") ||
    value.startsWith("fe8") ||
    value.startsWith("fe9") ||
    value.startsWith("fea") ||
    value.startsWith("feb") ||
    value.startsWith("ff") ||
    value.startsWith("2001:db8:") ||
    value.startsWith("::ffff:")
  );
}

async function readBoundedText(response: Response, limit: number): Promise<string> {
  if (!response.body) return "";
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let total = 0;
  let output = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > limit) {
      await reader.cancel();
      throw new Error("The page is too large to preview.");
    }
    output += decoder.decode(value, { stream: true });
  }
  return output + decoder.decode();
}

function extractMetadata(url: URL, html: string): LinkMetadata {
  const meta = (name: string): string => {
    const tags = html.match(/<meta\s+[^>]*>/giu) ?? [];
    for (const tag of tags) {
      const key = attribute(tag, "property") || attribute(tag, "name");
      if (key.toLowerCase() === name.toLowerCase())
        return decodeEntities(attribute(tag, "content")).trim();
    }
    return "";
  };
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/iu);
  const title =
    meta("og:title") ||
    decodeEntities(titleMatch?.[1] ?? "")
      .replace(/\s+/gu, " ")
      .trim();
  const description = meta("og:description") || meta("description");
  const rawImage = meta("og:image");
  let imageUrl = "";
  if (rawImage) {
    try {
      const candidate = new URL(rawImage, url);
      if (candidate.protocol === "https:") imageUrl = candidate.href;
    } catch {
      /* Ignore invalid optional image metadata. */
    }
  }
  return {
    url: url.href,
    title: title.slice(0, 500),
    description: description.slice(0, 2_000),
    imageUrl,
  };
}

function attribute(tag: string, name: string): string {
  const expression = new RegExp(`${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "iu");
  const match = tag.match(expression);
  return match?.[1] ?? match?.[2] ?? match?.[3] ?? "";
}

function decodeEntities(value: string): string {
  const named: Record<string, string> = {
    amp: "&",
    quot: '"',
    apos: "'",
    lt: "<",
    gt: ">",
    nbsp: " ",
  };
  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/giu, (_, entity: string) => {
    if (entity.startsWith("#x")) return String.fromCodePoint(Number.parseInt(entity.slice(2), 16));
    if (entity.startsWith("#")) return String.fromCodePoint(Number.parseInt(entity.slice(1), 10));
    return named[entity.toLowerCase()] ?? `&${entity};`;
  });
}
