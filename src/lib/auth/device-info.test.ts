import { describe, it, expect } from "vitest";
import { describeIp, parseUserAgent } from "./device-info";

// Valores reales verificados en la tabla `sessions` del entorno de desarrollo.
const PIXEL_9_ANDROID_CHROME =
  "Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Mobile Safari/537.36";
const WINDOWS_DESKTOP_CHROME =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36";
const WINDOWS_DESKTOP_FIREFOX =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:155.0) Gecko/20100101 Firefox/155.0";

describe("parseUserAgent con UAs reales de la BD", () => {
  it("clasifica un Pixel 9 Android como móvil con Chrome", () => {
    expect(parseUserAgent(PIXEL_9_ANDROID_CHROME)).toEqual({
      deviceType: "mobile",
      browser: "Chrome",
      os: "Android",
    });
  });

  it("clasifica desktop Windows/Chrome", () => {
    expect(parseUserAgent(WINDOWS_DESKTOP_CHROME)).toEqual({
      deviceType: "desktop",
      browser: "Chrome",
      os: "Windows 10",
    });
  });

  it("clasifica desktop Windows/Firefox", () => {
    expect(parseUserAgent(WINDOWS_DESKTOP_FIREFOX)).toEqual({
      deviceType: "desktop",
      browser: "Firefox",
      os: "Windows 10",
    });
  });

  it("clasifica iPad como tablet con Safari/iOS", () => {
    const ua =
      "Mozilla/5.0 (iPad; CPU OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1";
    expect(parseUserAgent(ua)).toEqual({
      deviceType: "tablet",
      browser: "Safari",
      os: "iOS",
    });
  });

  it("clasifica iPhone como móvil con Safari/iOS", () => {
    const ua =
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1";
    expect(parseUserAgent(ua)).toEqual({
      deviceType: "mobile",
      browser: "Safari",
      os: "iOS",
    });
  });

  it("clasifica macOS con Chrome", () => {
    const ua =
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";
    expect(parseUserAgent(ua)).toEqual({
      deviceType: "desktop",
      browser: "Chrome",
      os: "macOS",
    });
  });

  it("devuelve unknown ante User-Agent vacío o nulo", () => {
    expect(parseUserAgent("")).toEqual({ deviceType: "unknown", browser: null, os: null });
    expect(parseUserAgent(null)).toEqual({ deviceType: "unknown", browser: null, os: null });
    expect(parseUserAgent(undefined)).toEqual({ deviceType: "unknown", browser: null, os: null });
  });
});

describe("describeIp con valores reales de la BD", () => {
  it("trata la IPv6 unspecified (0000:0000:0000:0000:0000:0000:0000:0000) como sin IP", () => {
    expect(describeIp("0000:0000:0000:0000:0000:0000:0000:0000")).toEqual({
      kind: "unspecified",
      normalized: null,
    });
  });

  it("trata '0:0:0:0:0:0:0:0' y '::' como unspecified", () => {
    expect(describeIp("0:0:0:0:0:0:0:0")).toEqual({ kind: "unspecified", normalized: null });
    expect(describeIp("::")).toEqual({ kind: "unspecified", normalized: null });
  });

  it("trata IP vacía o nula como none", () => {
    expect(describeIp("")).toEqual({ kind: "none", normalized: null });
    expect(describeIp(null)).toEqual({ kind: "none", normalized: null });
    expect(describeIp(undefined)).toEqual({ kind: "none", normalized: null });
  });

  it("identifica loopback (127.0.0.1 y ::1)", () => {
    expect(describeIp("127.0.0.1")).toEqual({ kind: "loopback", normalized: "127.0.0.1" });
    expect(describeIp("::1")).toEqual({ kind: "loopback", normalized: "::1" });
  });

  it("extrae IPv4 de una IPv4-mapeada a IPv6", () => {
    expect(describeIp("::ffff:192.168.1.5")).toEqual({
      kind: "public",
      normalized: "192.168.1.5",
    });
  });

  it("conserva IPs públicas IPv4 e IPv6", () => {
    expect(describeIp("201.151.12.34")).toEqual({ kind: "public", normalized: "201.151.12.34" });
    expect(describeIp("2001:db8::1")).toEqual({ kind: "public", normalized: "2001:db8::1" });
  });
});