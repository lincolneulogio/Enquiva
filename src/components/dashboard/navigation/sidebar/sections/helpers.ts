import type { Permission } from "@/lib/auth/rbac";
import { filterNavItemsByPermissions } from "@/lib/navigation/sidebar-permissions";
import type { NavSection } from "../types";

export const compactSections = (sections: NavSection[]): NavSection[] =>
  sections.filter((section) => section.items.length > 0);

export function applyPermissionFilter(
  sections: NavSection[],
  allowedPermissions: readonly Permission[] | null | undefined,
): NavSection[] {
  if (!allowedPermissions) return sections;
  const allowed = new Set(allowedPermissions);
  return compactSections(
    sections.map((section) => ({
      ...section,
      items: filterNavItemsByPermissions(section.items, allowed),
    })),
  );
}
