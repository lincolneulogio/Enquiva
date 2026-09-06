import {
  ROLE_ORDER,
  PERMISSION_GROUPS,
  type AppRole,
  type Permission,
  type PermissionMatrix,
} from "@/lib/auth/rbac";

export function cloneMatrix(matrix: PermissionMatrix): PermissionMatrix {
  return {
    super_admin: { ...matrix.super_admin },
    admin: { ...matrix.admin },
    organizer: { ...matrix.organizer },
    member: { ...matrix.member },
    scanner: { ...matrix.scanner },
  };
}

export function diffPermissionChanges(
  baseline: PermissionMatrix,
  draft: PermissionMatrix,
): { role: AppRole; permission: Permission; allowed: boolean }[] {
  const changes: { role: AppRole; permission: Permission; allowed: boolean }[] = [];
  for (const role of ROLE_ORDER) {
    if (role === "super_admin") continue;
    for (const group of PERMISSION_GROUPS) {
      for (const permission of group.permissions) {
        if (draft[role][permission] !== baseline[role][permission]) {
          changes.push({
            role,
            permission,
            allowed: draft[role][permission],
          });
        }
      }
    }
  }
  return changes;
}
