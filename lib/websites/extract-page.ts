import { createHash } from "node:crypto";

export type ExtractedPage = {
  title: string | null;
  h1: string | null;
  summary: string;
  text: string;
  links: string[]; // absolute URLs found on the page
  isIndexable: boolean;
  contentHash: string;
};

const MAX_TEXT_CHARS = 20_000;

/**
 * Minimal, dependency-free HTML extraction: strips script/style, pulls
 * title/h1/meta description, plain text, and same-origin links. This text
 * later becomes untrusted "data" fed to an LLM — it is never treated as
 * instructions (see lib/ai/prompts).
 */
export function extractPage(html: string, pageUrl: string): ExtractedPage {
  const withoutNoise = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");

  const title = matchOne(/<title[^>]*>([\s\S]*?)<\/title>/i, withoutNoise);
  const h1 = matchOne(/<h1[^>]*>([\s\S]*?)<\/h1>/i, withoutNoise);
  const metaDescription = matchOne(
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i,
    withoutNoise,
  );
  const robotsMeta = matchOne(/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']*)["']/i, withoutNoise);
  const isIndexable = !robotsMeta?.toLowerCase().includes("noindex");

  const text = decodeEntities(withoutNoise.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_TEXT_CHARS);

  const links = extractLinks(withoutNoise, pageUrl);

  const summary = (metaDescription ?? text).slice(0, 300);
  const contentHash = createHash("sha256").update(text).digest("hex");

  return {
    title: title ? decodeEntities(title).trim().slice(0, 300) : null,
    h1: h1 ? decodeEntities(stripTags(h1)).trim().slice(0, 300) : null,
    summary,
    text,
    links,
    isIndexable,
    contentHash,
  };
}

function matchOne(pattern: RegExp, source: string): string | null {
  return pattern.exec(source)?.[1] ?? null;
}

function stripTags(source: string): string {
  return source.replace(/<[^>]+>/g, " ");
}

function decodeEntities(source: string): string {
  return source
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function extractLinks(html: string, pageUrl: string): string[] {
  const base = new URL(pageUrl);
  const found = new Set<string>();

  for (const match of html.matchAll(/<a\s[^>]*href=["']([^"'#]+)["']/gi)) {
    try {
      const resolved = new URL(match[1], base);
      if (resolved.protocol !== "http:" && resolved.protocol !== "https:") continue;
      if (resolved.hostname !== base.hostname) continue;
      resolved.hash = "";
      found.add(resolved.toString());
    } catch {
      // ignore malformed hrefs
    }
  }

  return Array.from(found);
}
