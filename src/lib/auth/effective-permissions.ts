import { cache } from "react";
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
import { canonicalizePermission } from "@/lib/auth/permission-legacy";

export function applyOverrides(
  matrix: PermissionMatrix,
  overrides: { roleName: string; permission: string; allowed: boolean }[],
) {
  for (const row of overrides) {
    const role = normalizeRole(row.roleName);
    const permission = canonicalizePermission(row.permission);
    if (role !== "super_admin" && permission) {
      matrix[role][permission] = row.allowed;
    }
  }

  for (const permission of PERMISSIONS) {
    matrix.super_admin[permission] = true;
  }
}

/** Matriz completa con overrides de BD — cacheada por request (React cache). */
export const getFullEffectivePermissionMatrix = cache(async (): Promise<PermissionMatrix> => {
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
});

const getOverridesForRole = cache(async (role: string) => {
  return db
    .select({
      permission: rolePermissions.permission,
      allowed: rolePermissions.allowed,
    })
    .from(rolePermissions)
    .where(eq(rolePermissions.roleName, role));
});

/** Comprueba un permiso aplicando overrides guardados en BD (1 query cacheada por rol/request). */
export async function hasEffectivePermission(
  roleInput: string | null | undefined,
  permission: Permission,
): Promise<boolean> {
  const role = normalizeRole(roleInput);
  if (role === "super_admin") return true;

  const matrix = getDefaultPermissionMatrix();
  const overrides = await getOverridesForRole(role);

  for (const row of overrides) {
    const canonical = canonicalizePermission(row.permission);
    if (canonical) {
      matrix[role][canonical] = row.allowed;
    }
  }

  return matrix[role][permission] ?? false;
}

export async function getEffectivePermissionsForRole(
  roleInput: string | null | undefined,
): Promise<Permission[]> {
  const matrix = await getFullEffectivePermissionMatrix();
  const role = normalizeRole(roleInput);
  return PERMISSIONS.filter((permission) => matrix[role][permission]);
}
