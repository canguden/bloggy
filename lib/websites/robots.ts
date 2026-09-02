import { safeFetchHtml } from "./url-guard";

/** Very small robots.txt reader: only enough to respect a blanket disallow for our UA / "*". */
export async function isAllowedByRobots(rootUrl: string, path: string): Promise<boolean> {
  try {
    const robotsUrl = new URL("/robots.txt", rootUrl).toString();
    const { html: body } = await safeFetchHtml(robotsUrl, {
      allowedContentTypes: ["text/plain", "text/html"],
    });
    return isPathAllowed(body, path);
  } catch {
    // No robots.txt, or it failed to load — default to allowed.
    return true;
  }
}

function isPathAllowed(robotsTxt: string, path: string): boolean {
  const lines = robotsTxt.split("\n").map((l) => l.trim());
  let applies = false;
  const disallowed: string[] = [];

  for (const line of lines) {
    const [rawKey, ...rest] = line.split(":");
    const key = rawKey?.toLowerCase();
    const value = rest.join(":").trim();

    if (key === "user-agent") {
      applies = value === "*" || value.toLowerCase() === "bloggybot";
    } else if (key === "disallow" && applies && value) {
      disallowed.push(value);
    }
  }

  return !disallowed.some((rule) => path.startsWith(rule));
}
