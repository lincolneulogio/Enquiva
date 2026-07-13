export type AnnouncementSeverity = "info" | "warning" | "critical";

export const ANNOUNCEMENT_SEVERITIES: AnnouncementSeverity[] = [
  "info",
  "warning",
  "critical",
];

export function isAnnouncementSeverity(value: unknown): value is AnnouncementSeverity {
  return value === "info" || value === "warning" || value === "critical";
}

export type PlatformOpsStatus = {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  announcementEnabled: boolean;
  announcementMessage: string;
  announcementSeverity: AnnouncementSeverity;
  announcementDismissible: boolean;
};

const DEFAULT_OPS: PlatformOpsStatus = {
  maintenanceMode: false,
  maintenanceMessage: "",
  announcementEnabled: false,
  announcementMessage: "",
  announcementSeverity: "info",
  announcementDismissible: true,
};

const CACHE_TTL_MS = 8_000;

let cache: { expires: number; data: PlatformOpsStatus } | null = null;

export function invalidatePlatformOpsCache(): void {
  cache = null;
}

export function opsStatusFromSettings(input: {
  maintenanceMode?: boolean;
  maintenanceMessage?: string;
  announcementEnabled?: boolean;
  announcementMessage?: string;
  announcementSeverity?: string;
  announcementDismissible?: boolean;
}): PlatformOpsStatus {
  return {
    maintenanceMode: Boolean(input.maintenanceMode),
    maintenanceMessage: (input.maintenanceMessage ?? "").trim(),
    announcementEnabled: Boolean(input.announcementEnabled),
    announcementMessage: (input.announcementMessage ?? "").trim(),
    announcementSeverity: isAnnouncementSeverity(input.announcementSeverity)
      ? input.announcementSeverity
      : "info",
    announcementDismissible: input.announcementDismissible !== false,
  };
}

export function getDefaultPlatformOpsStatus(): PlatformOpsStatus {
  return { ...DEFAULT_OPS };
}

/** Cache corta para el proxy (evita un SELECT en cada hop). */
export async function getCachedPlatformOpsStatus(
  loader: () => Promise<PlatformOpsStatus>,
): Promise<PlatformOpsStatus> {
  const now = Date.now();
  if (cache && now < cache.expires) {
    return cache.data;
  }
  try {
    const data = await loader();
    cache = { expires: now + CACHE_TTL_MS, data };
    return data;
  } catch {
    return cache?.data ?? getDefaultPlatformOpsStatus();
  }
}

/** Rutas accesibles durante mantenimiento (además de superadmin autenticado). */
export function isMaintenanceAllowedPath(pathname: string): boolean {
  if (pathname === "/maintenance") return true;
  if (
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password" ||
    pathname === "/verify-account" ||
    pathname === "/superadmin/login" ||
    pathname === "/superadmin/register"
  ) {
    return true;
  }
  if (pathname.startsWith("/reset-password/")) return true;
  if (pathname.startsWith("/verify-account")) return true;
  if (pathname === "/ticket" || pathname.startsWith("/ticket/")) return true;
  if (pathname.startsWith("/_next/") || pathname.startsWith("/images/")) return true;
  if (pathname === "/favicon.ico") return true;
  return false;
}
