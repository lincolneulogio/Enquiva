import { hasEffectivePermission } from "./effective-permissions";
import type { Permission } from "./rbac";
import type { SessionUser } from "./guards";

/**
 * Error de autorización basado en la matriz de permisos efectiva (rol + overrides en BD).
 * Se distingue de otros errores para poder mapearlo a un mensaje claro en la UI.
 */
export class PermissionError extends Error {
  code = "PERMISSION_DENIED";

  constructor(message = "No tienes permiso para realizar esta acción.") {
    super(message);
    this.name = "PermissionError";
  }
}

/** `true` si el usuario tiene el permiso efectivo (super_admin siempre `true`). */
export async function can(
  user: Pick<SessionUser, "role">,
  permission: Permission,
): Promise<boolean> {
  return hasEffectivePermission(user.role, permission);
}

/** `true` si el usuario tiene al menos uno de los permisos. */
export async function canAny(
  user: Pick<SessionUser, "role">,
  permissions: Permission[],
): Promise<boolean> {
  for (const permission of permissions) {
    if (await hasEffectivePermission(user.role, permission)) return true;
  }
  return false;
}

/** Lanza `PermissionError` si el usuario no tiene el permiso efectivo. */
export async function assertPermission(
  user: Pick<SessionUser, "role">,
  permission: Permission,
  message?: string,
): Promise<void> {
  if (!(await hasEffectivePermission(user.role, permission))) {
    throw new PermissionError(message);
  }
}

/** Lanza si el usuario no tiene ninguno de los permisos indicados. */
export async function assertAnyPermission(
  user: Pick<SessionUser, "role">,
  permissions: Permission[],
  message?: string,
): Promise<void> {
  if (!(await canAny(user, permissions))) {
    throw new PermissionError(message);
  }
}

/**
 * Autoriza una acción sobre un recurso que puede ser "propio" o "de cualquiera".
 * - Con `anyPermission` → autorizado (el alcance por entidad se valida por separado).
 * - Sin él, pero con `ownPermission` y siendo dueño → autorizado.
 * - En cualquier otro caso lanza `PermissionError`.
 */
export async function assertOwnOrAnyPermission(
  user: Pick<SessionUser, "role">,
  opts: {
    anyPermission: Permission;
    ownPermission: Permission;
    isOwner: boolean;
    message?: string;
  },
): Promise<void> {
  if (await hasEffectivePermission(user.role, opts.anyPermission)) return;
  if (opts.isOwner && (await hasEffectivePermission(user.role, opts.ownPermission))) {
    return;
  }
  throw new PermissionError(opts.message);
}
