import { normalizeRole, type Permission } from "@/lib/auth/rbac";
import type { NavSection, OrganizerNavOptions, AdminNavOptions } from "./types";
import { compactSections, applyPermissionFilter } from "./sections/helpers";
import { organizerSections } from "./sections/organizer-nav";
import { adminUnassignedSections, adminSections } from "./sections/admin-nav";
import { memberSections, scannerSections } from "./sections/member-scanner-nav";

export {
  compactSections,
  applyPermissionFilter,
  organizerSections,
  adminUnassignedSections,
  adminSections,
  memberSections,
  scannerSections,
};

export function resolveSidebarSections(params: {
  role: string;
  organizerNav?: OrganizerNavOptions;
  adminNav?: AdminNavOptions;
  allowedPermissions?: readonly Permission[];
}): NavSection[] {
  const normalizedRole = normalizeRole(params.role);

  const roleSections =
    normalizedRole === "super_admin"
      ? adminSections({
          variant: "super_admin",
          showEntityTeam: params.adminNav?.showEntityTeam ?? false,
        })
      : normalizedRole === "admin"
        ? adminSections({
            variant: params.adminNav?.variant ?? "entity_admin",
            showEntityTeam: params.adminNav?.showEntityTeam ?? true,
          })
        : normalizedRole === "organizer"
          ? organizerSections(
              params.organizerNav ?? {
                showBroadcasts: true,
                showTransport: true,
                showExports: true,
              },
            )
          : normalizedRole === "scanner"
            ? scannerSections
            : memberSections;

  return applyPermissionFilter(roleSections, params.allowedPermissions);
}
