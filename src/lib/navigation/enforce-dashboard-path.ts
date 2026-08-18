import { redirect } from "next/navigation";
import type { Permission } from "@/lib/auth/rbac";
import { getDashboardHomeForRole } from "./dashboard-paths";
import { canAccessDashboardPath } from "./dashboard-permission-gates";

/** Redirige al home del rol si la ruta exige un permiso que la matriz efectiva no otorga. */
export function redirectIfDashboardPathForbidden(
  pathname: string,
  allowed: readonly Permission[],
  role: string | null | undefined,
): void {
  if (!canAccessDashboardPath(pathname, allowed)) {
    redirect(getDashboardHomeForRole(role));
  }
}
