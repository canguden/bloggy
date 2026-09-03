import { describe, expect, it } from "vitest";
import { extractPage } from "./extract-page";

const SAMPLE_HTML = `
<html>
  <head>
    <title>Basecamp — Project management</title>
    <meta name="description" content="The all-in-one toolkit for working remotely.">
  </head>
  <body>
    <h1>Basecamp</h1>
    <script>console.log("should be stripped")</script>
    <p>Basecamp is project management software.</p>
    <a href="/pricing">Pricing</a>
    <a href="https://basecamp.com/about">About</a>
    <a href="https://external.com/page">External</a>
    <a href="mailto:hi@basecamp.com">Email</a>
  </body>
</html>
`;

describe("extractPage", () => {
  const result = extractPage(SAMPLE_HTML, "https://basecamp.com/");

  it("extracts title and h1", () => {
    expect(result.title).toBe("Basecamp — Project management");
    expect(result.h1).toBe("Basecamp");
  });

  it("uses the meta description as the summary", () => {
    expect(result.summary).toContain("all-in-one toolkit");
  });

  it("strips script content from the extracted text", () => {
    expect(result.text).not.toContain("should be stripped");
    expect(result.text).toContain("Basecamp is project management software");
  });

  it("keeps only same-origin links, absolute and deduped", () => {
    expect(result.links).toContain("https://basecamp.com/pricing");
    expect(result.links).toContain("https://basecamp.com/about");
    expect(result.links).not.toContain("https://external.com/page");
    expect(result.links.some((l) => l.startsWith("mailto:"))).toBe(false);
  });

  it("defaults to indexable when there is no robots meta tag", () => {
    expect(result.isIndexable).toBe(true);
  });

  it("respects a noindex robots meta tag", () => {
    const noindexHtml = SAMPLE_HTML.replace("</head>", '<meta name="robots" content="noindex"></head>');
    expect(extractPage(noindexHtml, "https://basecamp.com/").isIndexable).toBe(false);
  });

  it("produces a stable content hash for identical text", () => {
    const again = extractPage(SAMPLE_HTML, "https://basecamp.com/");
    expect(again.contentHash).toBe(result.contentHash);
  });
});
