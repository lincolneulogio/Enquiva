import { db } from "@/lib/db";
import { rolePermissions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  PERMISSIONS,
  getDefaultPermissionMatrix,
  normalizeRole,
  type Permission,
  type PermissionMatrix,
} from "@/lib/auth/rbac";

export function applyOverrides(
  matrix: PermissionMatrix,
  overrides: { roleName: string; permission: string; allowed: boolean }[],
) {
  for (const row of overrides) {
    const role = normalizeRole(row.roleName);
    const permission = row.permission as Permission;
    if (role !== "super_admin" && PERMISSIONS.includes(permission)) {
      matrix[role][permission] = row.allowed;
    }
  }

  for (const permission of PERMISSIONS) {
    matrix.super_admin[permission] = true;
  }
}

/** Matriz completa con overrides de BD (pantalla /admin/permissions). */
export async function getFullEffectivePermissionMatrix(): Promise<PermissionMatrix> {
  const matrix = getDefaultPermissionMatrix();
  const overrides = await db
    .select({
      roleName: rolePermissions.roleName,
      permission: rolePermissions.permission,
      allowed: rolePermissions.allowed,
    })
    .from(rolePermissions);

  applyOverrides(matrix, overrides);
  return matrix;
}

/** Comprueba un permiso aplicando overrides guardados en BD. */
export async function hasEffectivePermission(
  roleInput: string | null | undefined,
  permission: Permission,
): Promise<boolean> {
  const role = normalizeRole(roleInput);
  if (role === "super_admin") return true;

  const matrix = getDefaultPermissionMatrix();
  const overrides = await db
    .select({
      permission: rolePermissions.permission,
      allowed: rolePermissions.allowed,
    })
    .from(rolePermissions)
    .where(eq(rolePermissions.roleName, role));

  for (const row of overrides) {
    const p = row.permission as Permission;
    if (PERMISSIONS.includes(p)) {
      matrix[role][p] = row.allowed;
    }
  }

  return matrix[role][permission] ?? false;
}

export async function getEffectivePermissionsForRole(roleInput: string | null | undefined): Promise<Permission[]> {
  const matrix = await getFullEffectivePermissionMatrix();
  const role = normalizeRole(roleInput);
  return PERMISSIONS.filter((permission) => matrix[role][permission]);
}
