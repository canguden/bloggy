import "server-only";
import { BlockList, isIPv4 } from "node:net";
import { lookup as dnsLookup } from "node:dns/promises";
import type { LookupAddress } from "node:dns";
import * as http from "node:http";
import * as https from "node:https";

/**
 * SSRF guard for the website crawler. A crawl target is untrusted input —
 * this module is the boundary that keeps it from reaching internal/private
 * infrastructure.
 *
 * Validation happens inside the `lookup` option of Node's own http/https
 * Agent, so it runs at the moment a socket is actually opened — for the
 * initial request AND every redirect hop (each hop gets a fresh request
 * through the same guarded agents) — which is what defeats DNS rebinding
 * (an attacker changing the DNS answer between our check and the real
 * connect). A pre-flight-only check would not catch that. We use Node's core
 * http/https modules directly (not a third-party HTTP client) so this
 * `lookup` hook is guaranteed to be the one actually consulted — no risk of
 * a version mismatch between an external client's connection internals and
 * Node's own.
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

type NodeLookupCallback = (
  err: NodeJS.ErrnoException | null,
  address: string | LookupAddress[],
  family?: number,
) => void;

/** Shared by both agents below — resolves via Node's own DNS, validates every candidate address, then answers Node's own connect logic in whichever shape it asked for. */
function guardedLookup(
  hostname: string,
  options: { all?: boolean },
  callback: NodeLookupCallback,
): void {
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
      if (options.all) {
        callback(null, addresses);
      } else {
        callback(null, addresses[0].address, addresses[0].family);
      }
    })
    .catch((err) => callback(err, []));
}

const guardedHttpAgent = new http.Agent({ lookup: guardedLookup as never, timeout: CONNECT_TIMEOUT_MS });
const guardedHttpsAgent = new https.Agent({ lookup: guardedLookup as never, timeout: CONNECT_TIMEOUT_MS });

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

type RawResponse = { statusCode: number; headers: http.IncomingHttpHeaders; body: Buffer };

function requestOnce(url: URL): Promise<RawResponse> {
  const client = url.protocol === "https:" ? https : http;
  const agent = url.protocol === "https:" ? guardedHttpsAgent : guardedHttpAgent;

  return new Promise((resolve, reject) => {
    const req = client.request(
      url,
      {
        agent,
        method: "GET",
        headers: { "user-agent": "BloggyBot/1.0 (+https://bloggy.so/bot)" },
        timeout: RESPONSE_TIMEOUT_MS,
      },
      (res) => {
        const chunks: Buffer[] = [];
        let total = 0;
        let rejected = false;

        res.on("data", (chunk: Buffer) => {
          total += chunk.length;
          if (total > MAX_RESPONSE_BYTES) {
            rejected = true;
            res.destroy();
            reject(new FetchTooLargeError("Response exceeds the size limit"));
            return;
          }
          chunks.push(chunk);
        });
        res.on("end", () => {
          if (rejected) return;
          resolve({ statusCode: res.statusCode ?? 0, headers: res.headers, body: Buffer.concat(chunks) });
        });
        res.on("error", (err) => {
          if (!rejected) reject(err);
        });
      },
    );

    req.on("timeout", () => req.destroy(new Error("Request timed out")));
    req.on("error", reject);
    req.end();
  });
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
    const response = await requestOnce(currentUrl);

    if (response.statusCode >= 300 && response.statusCode < 400) {
      const location = response.headers.location;
      if (!location) throw new UnsafeUrlError("Redirect with no Location header");
      currentUrl = assertSafeUrlShape(new URL(location, currentUrl).toString());
      continue;
    }

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw new UnsafeUrlError(`Request failed with status ${response.statusCode}`);
    }

    const contentType = response.headers["content-type"] ?? "";
    if (!allowedContentTypes.some((allowed) => contentType.includes(allowed))) {
      throw new UnsupportedContentTypeError(`Unsupported content-type: ${contentType}`);
    }

    return { finalUrl: currentUrl.toString(), html: response.body.toString("utf-8") };
  }

  throw new UnsafeUrlError("Too many redirects");
}
