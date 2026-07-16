import { isWithinInclusiveStartWindow } from "@/lib/datetime/zoned-day";

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
  /** Mantenimiento efectivo ahora (manual o ventana programada). */
  maintenanceMode: boolean;
  /** Toggle manual persistido (aunque la ventana programada diga otra cosa). */
  maintenanceManual: boolean;
  maintenanceMessage: string;
  maintenanceStartsAt: string | null;
  maintenanceEndsAt: string | null;
  /** Banner habilitado en settings (aún puede estar fuera de ventana). */
  announcementEnabled: boolean;
  /** Visible ahora según ventana de horario. */
  announcementActive: boolean;
  announcementMessage: string;
  announcementSeverity: AnnouncementSeverity;
  announcementDismissible: boolean;
  announcementStartsAt: string | null;
  announcementEndsAt: string | null;
  announcementEventAt: string | null;
};

const DEFAULT_OPS: PlatformOpsStatus = {
  maintenanceMode: false,
  maintenanceManual: false,
  maintenanceMessage: "",
  maintenanceStartsAt: null,
  maintenanceEndsAt: null,
  announcementEnabled: false,
  announcementActive: false,
  announcementMessage: "",
  announcementSeverity: "info",
  announcementDismissible: true,
  announcementStartsAt: null,
  announcementEndsAt: null,
  announcementEventAt: null,
};

// Evita consultar settings/BD en cada navegación. Los cambios manuales invalidan
// esta caché inmediatamente mediante invalidatePlatformOpsCache().
const CACHE_TTL_MS = 30_000;

let cache: { expires: number; data: PlatformOpsStatus } | null = null;

export function invalidatePlatformOpsCache(): void {
  cache = null;
}

function toIso(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function opsStatusFromSettings(
  input: {
    maintenanceMode?: boolean;
    maintenanceMessage?: string;
    maintenanceStartsAt?: Date | string | null;
    maintenanceEndsAt?: Date | string | null;
    announcementEnabled?: boolean;
    announcementMessage?: string;
    announcementSeverity?: string;
    announcementDismissible?: boolean;
    announcementStartsAt?: Date | string | null;
    announcementEndsAt?: Date | string | null;
    announcementEventAt?: Date | string | null;
  },
  now: Date = new Date(),
): PlatformOpsStatus {
  const maintenanceManual = Boolean(input.maintenanceMode);
  const maintStart = toDate(input.maintenanceStartsAt);
  const maintEnd = toDate(input.maintenanceEndsAt);
  const scheduledMaintenanceActive =
    Boolean(maintStart) && isWithinInclusiveStartWindow(now, maintStart, maintEnd);

  const announcementEnabled = Boolean(input.announcementEnabled);
  const announcementMessage = (input.announcementMessage ?? "").trim();
  const annStart = toDate(input.announcementStartsAt);
  const annEnd = toDate(input.announcementEndsAt);
  const announcementActive =
    announcementEnabled &&
    Boolean(announcementMessage) &&
    isWithinInclusiveStartWindow(now, annStart, annEnd);

  return {
    maintenanceMode: maintenanceManual || scheduledMaintenanceActive,
    maintenanceManual,
    maintenanceMessage: (input.maintenanceMessage ?? "").trim(),
    maintenanceStartsAt: toIso(maintStart),
    maintenanceEndsAt: toIso(maintEnd),
    announcementEnabled,
    announcementActive,
    announcementMessage,
    announcementSeverity: isAnnouncementSeverity(input.announcementSeverity)
      ? input.announcementSeverity
      : "info",
    announcementDismissible: input.announcementDismissible !== false,
    announcementStartsAt: toIso(annStart),
    announcementEndsAt: toIso(annEnd),
    announcementEventAt: toIso(input.announcementEventAt),
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
