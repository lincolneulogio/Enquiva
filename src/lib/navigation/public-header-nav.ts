import { normalizeRole, type AppRole } from "@/lib/auth/rbac";
import { getStaffDashboardHome } from "@/lib/navigation/dashboard-paths";
import { getAttendeeDestination } from "@/lib/navigation/attendee-paths";

export type PublicNavLink = {
  href: string;
  label: string;
};

type NavCopy = {
  browseEvents: string;
  plans: string;
  tickets: string;
  myEvents: string;
  scan: string;
  saasPlans: string;
  entityPlan: string;
  billing: string;
  dashboard: string;
};

export function getPublicDashboardPath(role?: string | null): string {
  const normalized = normalizeRole(role);
  if (normalized === "organizer") return "/organizer";
  if (normalized === "admin" || normalized === "super_admin") {
    return getStaffDashboardHome(role);
  }
  if (normalized === "scanner") return "/scanner";
  return "/member";
}

/**
 * Links del header público según el rol de sesión.
 * Visitantes ven marketing; miembros ven entradas; staff ve operación.
 */
export function getPublicHeaderNavLinks(
  role: string | null | undefined,
  copy: NavCopy,
): PublicNavLink[] {
  if (!role) {
    return [
      { href: "/events", label: copy.browseEvents },
      { href: "/pricing", label: copy.plans },
    ];
  }

  const normalized = normalizeRole(role) as AppRole;

  switch (normalized) {
    case "super_admin":
      return [
        { href: "/events", label: copy.browseEvents },
        { href: "/pricing", label: copy.plans },
        { href: "/superadmin/plans", label: copy.saasPlans },
        { href: "/superadmin/events", label: copy.myEvents },
      ];
    case "admin":
      return [
        { href: "/events", label: copy.browseEvents },
        { href: "/pricing", label: copy.plans },
        { href: "/admin/events", label: copy.myEvents },
        { href: "/admin/plan", label: copy.entityPlan },
      ];
    case "organizer":
      return [
        { href: "/events", label: copy.browseEvents },
        { href: "/pricing", label: copy.plans },
        { href: "/organizer/events", label: copy.myEvents },
        { href: "/organizer/billing", label: copy.billing },
        { href: "/organizer/scan", label: copy.scan },
      ];
    case "scanner":
      return [{ href: "/scanner/scan", label: copy.scan }];
    case "member":
    default:
      return [
        { href: "/events", label: copy.browseEvents },
        {
          href: getAttendeeDestination(role, "tickets"),
          label: copy.tickets,
        },
        {
          href: getAttendeeDestination(role, "events"),
          label: copy.myEvents,
        },
      ];
  }
}

export function getPublicHeaderDashboardLabel(
  role: string | null | undefined,
  locale: "es" | "en",
  fallback: string,
): string {
  const normalized = normalizeRole(role);
  if (locale === "en") {
    if (normalized === "super_admin") return "Platform panel";
    if (normalized === "admin") return "Admin panel";
    if (normalized === "organizer") return "Organizer panel";
    if (normalized === "scanner") return "Scanner";
    return fallback;
  }
  if (normalized === "super_admin") return "Panel plataforma";
  if (normalized === "admin") return "Panel admin";
  if (normalized === "organizer") return "Panel organizador";
  if (normalized === "scanner") return "Escanear";
  return fallback;
}
