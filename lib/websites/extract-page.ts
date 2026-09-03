import { createHash } from "node:crypto";
import * as cheerio from "cheerio";

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
 * Parses crawled HTML with cheerio: title/h1/meta description, plain text,
 * and same-origin links. This text later becomes untrusted "data" fed to an
 * LLM — it is never treated as instructions (see lib/ai/untrusted-content.ts).
 */
export function extractPage(html: string, pageUrl: string): ExtractedPage {
  const $ = cheerio.load(html);
  $("script, style, noscript").remove();

  const title = normalize($("title").first().text()) || null;
  const h1 = normalize($("h1").first().text()) || null;
  const metaDescription = normalize($('meta[name="description"]').attr("content") ?? "") || null;
  const robotsMeta = ($('meta[name="robots"]').attr("content") ?? "").toLowerCase();
  const isIndexable = !robotsMeta.includes("noindex");

  const text = normalize($("body").text()).slice(0, MAX_TEXT_CHARS);
  const links = extractLinks($, pageUrl);
  const summary = (metaDescription ?? text).slice(0, 300);
  const contentHash = createHash("sha256").update(text).digest("hex");

  return {
    title: title?.slice(0, 300) ?? null,
    h1: h1?.slice(0, 300) ?? null,
    summary,
    text,
    links,
    isIndexable,
    contentHash,
  };
}

function normalize(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function extractLinks($: cheerio.CheerioAPI, pageUrl: string): string[] {
  const base = new URL(pageUrl);
  const found = new Set<string>();

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;
    try {
      const resolved = new URL(href, base);
      if (resolved.protocol !== "http:" && resolved.protocol !== "https:") return;
      if (resolved.hostname !== base.hostname) return;
      resolved.hash = "";
      found.add(resolved.toString());
    } catch {
      // ignore malformed hrefs
    }
  });

  return Array.from(found);
}
