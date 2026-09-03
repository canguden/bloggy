import "server-only";
import { safeFetchHtml } from "./url-guard";
import { extractPage } from "./extract-page";
import { isAllowedByRobots } from "./robots";

export type CrawledPage = {
  url: string;
  title: string | null;
  h1: string | null;
  summary: string;
  text: string;
  isIndexable: boolean;
  contentHash: string;
};

const MAX_PAGES = 15;
const TOTAL_CRAWL_TIMEOUT_MS = 45_000;

/**
 * Crawls a website starting from its homepage: fetches the homepage, then a
 * bounded set of same-origin internal links (nav/footer/body links found on
 * pages already fetched). Every fetch goes through the SSRF-hardened
 * `safeFetchHtml`. The output is stored as-is in `website_pages` — it is
 * later treated as untrusted data when building AI prompts, never as
 * instructions. Also returns the homepage's raw HTML — the caller uses it to
 * resolve a favicon/site name (lib/websites/site-identity.ts) without a
 * second fetch.
 */
export async function crawlWebsite(rootUrl: string): Promise<{ pages: CrawledPage[]; homepageHtml: string | null }> {
  const deadline = Date.now() + TOTAL_CRAWL_TIMEOUT_MS;
  const visited = new Set<string>();
  const queue: string[] = [normalizeRoot(rootUrl)];
  const pages: CrawledPage[] = [];
  let homepageHtml: string | null = null;

  while (queue.length > 0 && pages.length < MAX_PAGES && Date.now() < deadline) {
    const url = queue.shift()!;
    if (visited.has(url)) continue;
    visited.add(url);
    const isHomepage = pages.length === 0 && homepageHtml === null;

    const path = safePath(url);
    if (path && !(await isAllowedByRobots(rootUrl, path))) continue;

    try {
      const { finalUrl, html } = await safeFetchHtml(url);
      if (isHomepage) homepageHtml = html;
      const extracted = extractPage(html, finalUrl);

      pages.push({
        url: finalUrl,
        title: extracted.title,
        h1: extracted.h1,
        summary: extracted.summary,
        text: extracted.text,
        isIndexable: extracted.isIndexable,
        contentHash: extracted.contentHash,
      });

      for (const link of extracted.links) {
        if (!visited.has(link) && queue.length + pages.length < MAX_PAGES * 2) {
          queue.push(link);
        }
      }
    } catch {
      // A single page failing (blocked address, timeout, wrong content-type)
      // should not fail the whole crawl — skip it and continue.
      continue;
    }
  }

  return { pages, homepageHtml };
}

function normalizeRoot(rootUrl: string): string {
  const url = new URL(rootUrl);
  url.hash = "";
  return url.toString();
}

function safePath(url: string): string | null {
  try {
    return new URL(url).pathname;
  } catch {
    return null;
  }
}
