import type { Permission } from "@/lib/auth/rbac";

/**
 * Requisitos de permiso para un ítem del sidebar.
 * Si `permissions` está vacío / ausente, el ítem es visible para el rol (tras filtros de variante/plan).
 * Con varios permisos se exige al menos uno (`any`).
 */
export type NavPermissionRequirement = {
  permissions?: readonly Permission[];
};

export function canShowNavByPermissions(
  requirement: NavPermissionRequirement | undefined,
  allowed: ReadonlySet<Permission> | readonly Permission[] | null | undefined,
): boolean {
  const required = requirement?.permissions;
  if (!required?.length) return true;
  if (!allowed) return true;

  const set =
    allowed instanceof Set ? allowed : new Set<Permission>(allowed);

  return required.some((permission) => set.has(permission));
}

export function filterNavItemsByPermissions<T extends NavPermissionRequirement>(
  items: T[],
  allowed: ReadonlySet<Permission> | readonly Permission[] | null | undefined,
): T[] {
  return items.filter((item) => canShowNavByPermissions(item, allowed));
}
