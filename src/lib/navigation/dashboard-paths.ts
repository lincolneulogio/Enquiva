import { normalizeRole } from "@/lib/auth/rbac";

export type StaffDashboardBase = "/admin" | "/superadmin";

const ENTITY_ADMIN_ONLY_SUFFIXES = ["/onboarding", "/team", "/plan"];

export function getStaffDashboardHome(role?: string | null): StaffDashboardBase {
  return normalizeRole(role) === "super_admin" ? "/superadmin" : "/admin";
}

export function getStaffDashboardBase(
  pathname?: string | null,
  role?: string | null,
): StaffDashboardBase {
  if (pathname?.startsWith("/superadmin")) return "/superadmin";
  if (pathname?.startsWith("/admin")) return "/admin";
  return getStaffDashboardHome(role);
}

export function staffDashboardPath(base: StaffDashboardBase, subpath = ""): string {
  if (!subpath) return base;
  const suffix = subpath.startsWith("/") ? subpath : `/${subpath}`;
  return `${base}${suffix}`;
}

export function mapAdminPathToSuperadmin(pathname: string): string {
  if (!pathname.startsWith("/admin")) return "/superadmin";
  const suffix = pathname.slice("/admin".length);
  if (ENTITY_ADMIN_ONLY_SUFFIXES.some((p) => suffix === p || suffix.startsWith(`${p}/`))) {
    return "/superadmin";
  }
  return `/superadmin${suffix}`;
}

export function mapSuperadminPathToAdmin(pathname: string): string {
  if (!pathname.startsWith("/superadmin")) return "/admin";
  const suffix = pathname.slice("/superadmin".length);
  return `/admin${suffix}`;
}
