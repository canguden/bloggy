import "server-only";
import * as cheerio from "cheerio";
import { safeFetchBinary } from "./url-guard";

export type SiteIdentity = {
  faviconUrl: string | null;
  siteName: string | null;
};

const FAVICON_SELECTORS = [
  'link[rel="apple-touch-icon"]',
  'link[rel="icon"]',
  'link[rel="shortcut icon"]',
] as const;

/**
 * Resolves a favicon + display name from a homepage's own HTML (already
 * fetched by the crawler — no extra page fetch here, only the icon itself).
 * The favicon URL comes from untrusted markup, so it is verified by actually
 * fetching it through the same SSRF-guarded path as everything else before
 * we trust it; a broken or malicious candidate just falls through to the
 * next one, then to no favicon at all — never a crash, never a bypass.
 */
export async function resolveSiteIdentity(rootUrl: string, homepageHtml: string): Promise<SiteIdentity> {
  const $ = cheerio.load(homepageHtml);
  const base = new URL(rootUrl);

  const siteName =
    normalize($('meta[property="og:site_name"]').attr("content")) ??
    normalize($("title").first().text()) ??
    null;

  const candidates: string[] = [];
  for (const selector of FAVICON_SELECTORS) {
    const href = $(selector).first().attr("href");
    const resolved = href ? resolveUrl(href, base) : null;
    if (resolved) candidates.push(resolved);
  }
  const faviconIco = resolveUrl("/favicon.ico", base);
  if (faviconIco) candidates.push(faviconIco);

  for (const candidate of candidates) {
    const verified = await verifyFaviconUrl(candidate);
    if (verified) return { faviconUrl: verified, siteName };
  }

  return { faviconUrl: null, siteName };
}

function resolveUrl(href: string, base: URL): string | null {
  try {
    return new URL(href, base).toString();
  } catch {
    return null;
  }
}

async function verifyFaviconUrl(url: string): Promise<string | null> {
  try {
    const result = await safeFetchBinary(url, { maxBytes: 256 * 1024 });
    return result.body.byteLength > 0 ? result.finalUrl : null;
  } catch {
    return null;
  }
}

function normalize(value: string | undefined): string | null {
  const trimmed = value?.replace(/\s+/g, " ").trim();
  return trimmed && trimmed.length > 0 ? trimmed.slice(0, 200) : null;
}
