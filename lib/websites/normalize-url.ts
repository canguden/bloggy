import { ValidationError } from "@/lib/errors";

/** Normalizes a user-entered website URL: adds https:// if missing, strips paths/query/hash. */
export function normalizeWebsiteUrl(input: string): { url: string; domain: string } {
  const trimmed = input.trim();
  if (!trimmed) throw new ValidationError("Enter a website URL");

  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  let parsed: URL;
  try {
    parsed = new URL(withScheme);
  } catch {
    throw new ValidationError("Enter a valid website URL, like example.com");
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new ValidationError("Only http and https URLs are supported");
  }
  if (!parsed.hostname.includes(".")) {
    throw new ValidationError("Enter a valid website URL, like example.com");
  }

  const domain = parsed.hostname.toLowerCase().replace(/^www\./, "");
  return { url: `${parsed.protocol}//${parsed.hostname}`, domain };
}
