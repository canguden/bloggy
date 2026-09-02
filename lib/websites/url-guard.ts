import "server-only";
import { BlockList, isIPv4 } from "node:net";
import { lookup as dnsLookup } from "node:dns/promises";
import { Agent, type Dispatcher } from "undici";

/**
 * SSRF guard for the website crawler. A crawl target is untrusted input —
 * this module is the boundary that keeps it from reaching internal/private
 * infrastructure.
 *
 * Validation happens inside the connection `lookup` hook of an undici Agent,
 * so it runs at the moment a socket is actually opened — for the initial
 * request AND every redirect hop — which is what defeats DNS rebinding
 * (an attacker changing the DNS answer between our check and the real
 * connect). A pre-flight-only check would not catch that.
 */
const blockedV4 = new BlockList();
const V4_BLOCKED_SUBNETS: Array<[string, number]> = [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10], // CGNAT
  ["127.0.0.0", 8], // loopback
  ["169.254.0.0", 16], // link-local
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24], // TEST-NET-1
  ["192.168.0.0", 16],
  ["198.18.0.0", 15], // benchmarking
  ["198.51.100.0", 24], // TEST-NET-2
  ["203.0.113.0", 24], // TEST-NET-3
  ["224.0.0.0", 4], // multicast
  ["240.0.0.0", 4], // reserved
];
for (const [addr, prefix] of V4_BLOCKED_SUBNETS) blockedV4.addSubnet(addr, prefix, "ipv4");

const blockedV6 = new BlockList();
const V6_BLOCKED_SUBNETS: Array<[string, number]> = [
  ["::1", 128], // loopback
  ["::", 128], // unspecified
  ["fc00::", 7], // unique local
  ["fe80::", 10], // link-local
  ["ff00::", 8], // multicast
];
for (const [addr, prefix] of V6_BLOCKED_SUBNETS) blockedV6.addSubnet(addr, prefix, "ipv6");

export class BlockedAddressError extends Error {
  constructor(host: string, address: string) {
    super(`Refusing to connect to ${host} (resolves to a non-public address: ${address})`);
    this.name = "BlockedAddressError";
  }
}

function extractIpv4Mapped(address: string): string | null {
  const match = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/i.exec(address);
  return match ? match[1] : null;
}

export function isBlockedAddress(address: string): boolean {
  const mapped = extractIpv4Mapped(address);
  if (mapped) return blockedV4.check(mapped, "ipv4");
  if (isIPv4(address)) return blockedV4.check(address, "ipv4");
  return blockedV6.check(address, "ipv6");
}

const MAX_REDIRECTS = 3;
const CONNECT_TIMEOUT_MS = 5000;
const RESPONSE_TIMEOUT_MS = 8000;
const MAX_RESPONSE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_CONTENT_TYPES = ["text/html", "application/xhtml+xml"];

/** Dispatcher whose every real connection is validated against the blocklists. */
const guardedAgent = new Agent({
  connectTimeout: CONNECT_TIMEOUT_MS,
  connect: {
    lookup(hostname, options, callback) {
      dnsLookup(hostname, { all: true, verbatim: true })
        .then((addresses) => {
          const blocked = addresses.find((a) => isBlockedAddress(a.address));
          if (blocked) {
            callback(new BlockedAddressError(hostname, blocked.address), []);
            return;
          }
          if (addresses.length === 0) {
            callback(new Error(`Could not resolve ${hostname}`), []);
            return;
          }
          // Node's net/tls connect calls this like its own dns.lookup: the
          // caller's `options.all` decides whether it wants every address
          // (array form) or just one (single-address form). We validate all
          // resolved addresses either way, then answer in whichever shape
          // was asked for.
          if (options.all) {
            callback(null, addresses as never);
          } else {
            callback(null, addresses[0].address, addresses[0].family);
          }
        })
        .catch((err) => callback(err, []));
    },
  },
});

export class UnsafeUrlError extends Error {}
export class FetchTooLargeError extends Error {}
export class UnsupportedContentTypeError extends Error {}

/** Validates scheme + hostname shape before any network activity. */
export function assertSafeUrlShape(rawUrl: string): URL {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new UnsafeUrlError("Not a valid URL");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new UnsafeUrlError("Only http and https URLs are supported");
  }
  if (url.username || url.password) {
    throw new UnsafeUrlError("URLs with embedded credentials are not supported");
  }
  return url;
}

/**
 * Fetches a URL with SSRF protections, a manual bounded redirect loop (each
 * hop re-validated and re-resolved), a response size cap, and a content-type
 * allowlist. Returns the final response body as text.
 */
export async function safeFetchHtml(
  rawUrl: string,
  options: { allowedContentTypes?: string[] } = {},
): Promise<{ finalUrl: string; html: string }> {
  const allowedContentTypes = options.allowedContentTypes ?? ALLOWED_CONTENT_TYPES;
  let currentUrl = assertSafeUrlShape(rawUrl);

  for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects++) {
    const response = await fetch(currentUrl, {
      redirect: "manual",
      signal: AbortSignal.timeout(RESPONSE_TIMEOUT_MS),
      headers: { "user-agent": "BloggyBot/1.0 (+https://bloggy.so/bot)" },
      // @ts-expect-error -- Node's fetch accepts a `dispatcher` option that isn't in the DOM lib types.
      dispatcher: guardedAgent as Dispatcher,
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      response.body?.cancel();
      if (!location) throw new UnsafeUrlError("Redirect with no Location header");
      currentUrl = assertSafeUrlShape(new URL(location, currentUrl).toString());
      continue;
    }

    if (!response.ok) {
      response.body?.cancel();
      throw new UnsafeUrlError(`Request failed with status ${response.status}`);
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!allowedContentTypes.some((allowed) => contentType.includes(allowed))) {
      response.body?.cancel();
      throw new UnsupportedContentTypeError(`Unsupported content-type: ${contentType}`);
    }

    const contentLength = Number(response.headers.get("content-length") ?? 0);
    if (contentLength > MAX_RESPONSE_BYTES) {
      response.body?.cancel();
      throw new FetchTooLargeError("Response exceeds the size limit");
    }

    const html = await readBodyWithCap(response);
    return { finalUrl: currentUrl.toString(), html };
  }

  throw new UnsafeUrlError("Too many redirects");
}

async function readBodyWithCap(response: Response): Promise<string> {
  if (!response.body) return "";
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_RESPONSE_BYTES) {
      await reader.cancel();
      throw new FetchTooLargeError("Response exceeds the size limit");
    }
    chunks.push(value);
  }

  return Buffer.concat(chunks).toString("utf-8");
}
