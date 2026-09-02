import { describe, expect, it } from "vitest";
import { assertSafeUrlShape, isBlockedAddress, UnsafeUrlError } from "./url-guard";

describe("assertSafeUrlShape", () => {
  it("accepts plain http/https URLs", () => {
    expect(() => assertSafeUrlShape("https://example.com")).not.toThrow();
    expect(() => assertSafeUrlShape("http://example.com/path")).not.toThrow();
  });

  it("rejects non-http(s) schemes", () => {
    expect(() => assertSafeUrlShape("file:///etc/passwd")).toThrow(UnsafeUrlError);
    expect(() => assertSafeUrlShape("ftp://example.com")).toThrow(UnsafeUrlError);
    expect(() => assertSafeUrlShape("javascript:alert(1)")).toThrow(UnsafeUrlError);
  });

  it("rejects URLs with embedded credentials", () => {
    expect(() => assertSafeUrlShape("https://user:pass@example.com")).toThrow(UnsafeUrlError);
  });

  it("rejects malformed URLs", () => {
    expect(() => assertSafeUrlShape("not a url")).toThrow(UnsafeUrlError);
  });
});

describe("isBlockedAddress", () => {
  it("blocks IPv4 loopback, private, and link-local ranges", () => {
    expect(isBlockedAddress("127.0.0.1")).toBe(true);
    expect(isBlockedAddress("10.0.0.5")).toBe(true);
    expect(isBlockedAddress("172.16.0.1")).toBe(true);
    expect(isBlockedAddress("192.168.1.1")).toBe(true);
    expect(isBlockedAddress("169.254.169.254")).toBe(true); // cloud metadata endpoint
    expect(isBlockedAddress("100.64.0.1")).toBe(true); // CGNAT
  });

  it("blocks IPv6 loopback and unique-local ranges", () => {
    expect(isBlockedAddress("::1")).toBe(true);
    expect(isBlockedAddress("fc00::1")).toBe(true);
    expect(isBlockedAddress("fe80::1")).toBe(true);
  });

  it("blocks IPv4-mapped IPv6 addresses pointing at private ranges", () => {
    expect(isBlockedAddress("::ffff:127.0.0.1")).toBe(true);
    expect(isBlockedAddress("::ffff:10.0.0.1")).toBe(true);
  });

  it("allows ordinary public addresses", () => {
    expect(isBlockedAddress("8.8.8.8")).toBe(false);
    expect(isBlockedAddress("93.184.216.34")).toBe(false);
  });
});
