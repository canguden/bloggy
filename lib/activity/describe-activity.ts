type ActivityPayload = Record<string, unknown>;

/** Turns a raw activity event into the plain sentence shown in the feed and dashboard. */
export function describeActivity(verb: string, payload: ActivityPayload): string {
  switch (verb) {
    case "analyzed_website":
      return `Bloggy analyzed ${payload.domain ?? "your website"} (${payload.pagesRead ?? 0} pages read).`;
    case "found_opportunities":
      return `Bloggy found ${payload.count ?? 0} content opportunities.`;
    case "generated_article":
      return `Bloggy wrote "${payload.title ?? "an article"}".`;
    case "marked_article_ready":
      return "An article was marked as ready.";
    default:
      return verb.replace(/_/g, " ");
  }
}
