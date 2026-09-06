/**
 * Parser ligero de user agents para la sección de sesiones activas.
 * Devuelve datos estructurados con los que la UI puede localizar las etiquetas.
 */
export type SessionDeviceType = "desktop" | "mobile" | "tablet" | "unknown";

export interface SessionDeviceInfo {
  deviceType: SessionDeviceType;
  browser: string | null;
  os: string | null;
}

/** Información de IP ya normalizada para mostrarla de forma verídica. */
export type IpKind = "none" | "unspecified" | "loopback" | "public";

export interface IpInfo {
  kind: IpKind;
  normalized: string | null;
}

function detectType(ua: string): SessionDeviceType {
  if (
    /ipad/i.test(ua) ||
    /tablet/i.test(ua) ||
    /kindle/i.test(ua) ||
    /playbook/i.test(ua) ||
    (/android/i.test(ua) && !/mobile/i.test(ua))
  ) {
    return "tablet";
  }
  if (
    /iphone/i.test(ua) ||
    /ipod/i.test(ua) ||
    /android.*mobile/i.test(ua) ||
    /windows phone/i.test(ua) ||
    /blackberry/i.test(ua) ||
    /opera mini/i.test(ua) ||
    /iemobile/i.test(ua)
  ) {
    return "mobile";
  }
  return "desktop";
}

function detectBrowser(ua: string): string | null {
  const checks: Array<[RegExp, string]> = [
    [/edg\//i, "Edge"],
    [/opr\//i, "Opera"],
    [/opera mini\//i, "Opera Mini"],
    [/opera\//i, "Opera"],
    [/samsungbrowser\//i, "Samsung Internet"],
    [/crios\//i, "Chrome"],
    [/fxios\//i, "Firefox"],
    [/chrome\//i, "Chrome"],
    [/firefox\//i, "Firefox"],
    [/version\/[\d.]+.*safari/i, "Safari"],
    [/safari\//i, "Safari"],
    [/msie\s[\d.]+/i, "Internet Explorer"],
    [/trident\/[\d.]+/i, "Internet Explorer"],
  ];
  for (const [re, name] of checks) {
    if (re.test(ua)) return name;
  }
  return null;
}

function detectOS(ua: string): string | null {
  const checks: Array<[RegExp, string]> = [
    [/windows phone/i, "Windows Phone"],
    [/windows nt 10\.0/i, "Windows 10"],
    [/windows nt 6\.3/i, "Windows 8.1"],
    [/windows nt 6\.[012]/i, "Windows 7"],
    [/windows nt 5\.1/i, "Windows XP"],
    [/windows/i, "Windows"],
    [/android/i, "Android"],
    [/iphone|ipad|ipod/i, "iOS"],
    [/cros/i, "Chrome OS"],
    [/linux/i, "Linux"],
    [/mac os x/i, "macOS"],
    [/macintosh/i, "macOS"],
  ];
  for (const [re, name] of checks) {
    if (re.test(ua)) return name;
  }
  return null;
}

export function parseUserAgent(userAgent?: string | null): SessionDeviceInfo {
  const ua = userAgent ?? "";
  if (!ua.trim()) {
    return { deviceType: "unknown", browser: null, os: null };
  }
  return {
    deviceType: detectType(ua),
    browser: detectBrowser(ua),
    os: detectOS(ua),
  };
}

/**
 * Indica si la dirección IPv6 es la dirección "unspecified" (todas las grupos a cero).
 * Cubre "::", "0:0:0:0:0:0:0:0" y "0000:0000:0000:0000:0000:0000:0000:0000".
 */
function isUnspecifiedIPv6(value: string): boolean {
  if (value === "::") return true;
  const groups = value.split(":");
  if (groups.length !== 8) return false;
  return groups.every((group) => /^0*$/.test(group));
}

/** Extrae IPv4 de una IPv4-mapeada a IPv6 (p.ej. "::ffff:192.168.0.1"). */
function getMappedIPv4(value: string): string | null {
  const match = value.toLowerCase().match(/^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
  return match ? match[1] : null;
}

export function describeIp(raw?: string | null): IpInfo {
  const value = (raw ?? "").trim();
  if (!value) return { kind: "none", normalized: null };

  if (isUnspecifiedIPv6(value)) {
    return { kind: "unspecified", normalized: null };
  }

  const mapped = getMappedIPv4(value);
  const target = mapped ?? value;

  if (target === "::1" || target === "127.0.0.1" || /^127\./.test(target)) {
    return { kind: "loopback", normalized: target === "::1" ? target : target };
  }

  return { kind: "public", normalized: target };
}