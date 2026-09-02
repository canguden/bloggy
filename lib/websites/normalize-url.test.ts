import { describe, expect, it } from "vitest";
import { normalizeWebsiteUrl } from "./normalize-url";
import { ValidationError } from "@/lib/errors";

describe("normalizeWebsiteUrl", () => {
  it("adds https:// when no scheme is given", () => {
    expect(normalizeWebsiteUrl("example.com")).toEqual({ url: "https://example.com", domain: "example.com" });
  });

  it("strips a leading www. from the domain", () => {
    expect(normalizeWebsiteUrl("https://www.example.com").domain).toBe("example.com");
  });

  it("strips paths, query strings, and hashes", () => {
    expect(normalizeWebsiteUrl("https://example.com/blog?x=1#top").url).toBe("https://example.com");
  });

  it("rejects empty input", () => {
    expect(() => normalizeWebsiteUrl("")).toThrow(ValidationError);
    expect(() => normalizeWebsiteUrl("   ")).toThrow(ValidationError);
  });

  it("rejects a hostname with no dot", () => {
    expect(() => normalizeWebsiteUrl("localhost")).toThrow(ValidationError);
  });

  it("rejects non-http(s) schemes", () => {
    expect(() => normalizeWebsiteUrl("ftp://example.com")).toThrow(ValidationError);
  });
});
