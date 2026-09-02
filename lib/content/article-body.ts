import { createHash } from "node:crypto";

/**
 * The article domain model stores `body` + a `format` discriminator rather
 * than assuming Markdown everywhere. Markdown is the only implementation
 * today; swapping in a richer editor later means adding a case here and to
 * the editor island — nothing else in the app should inspect article body
 * content directly.
 */
export type ArticleFormat = "markdown";

export function wordCount(body: string, format: ArticleFormat): number {
  if (format === "markdown") {
    const plain = body
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/[#*_>`~-]/g, " ")
      .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1");
    return plain.split(/\s+/).filter(Boolean).length;
  }
  return 0;
}

export function contentHash(body: string): string {
  return createHash("sha256").update(body).digest("hex");
}
