import { authorize, PermissionError, type AuthResource } from "./authorize";
import { normalizeRole, type Permission } from "./rbac";

export { PermissionError };
export type { AuthResource };

type PermissionSubject = { id?: string; role?: string | null; name?: string | null };

function requireUserId(user: PermissionSubject): string {
  if (!user.id) {
    throw new PermissionError("No se pudo resolver el usuario para autorizar.");
  }
  return user.id;
}

/** `true` si el usuario tiene el permiso efectivo (super_admin siempre `true`). */
export async function can(
  user: PermissionSubject,
  permission: Permission,
  resource?: AuthResource,
): Promise<boolean> {
  try {
    await authorize({
      user: { id: requireUserId(user), role: user.role, name: user.name },
      permission,
      resource,
      audit: false,
    });
    return true;
  } catch (error) {
    if (error instanceof PermissionError) return false;
    throw error;
  }
}

/** `true` si el usuario tiene al menos uno de los permisos. */
export async function canAny(
  user: PermissionSubject,
  permissions: Permission[],
  resource?: AuthResource,
): Promise<boolean> {
  try {
    await authorize({
      user: { id: requireUserId(user), role: user.role, name: user.name },
      permissions,
      resource,
      audit: false,
    });
    return true;
  } catch (error) {
    if (error instanceof PermissionError) return false;
    throw error;
  }
}

/** Lanza `PermissionError` si el usuario no tiene el permiso efectivo. */
export async function assertPermission(
  user: PermissionSubject,
  permission: Permission,
  message?: string,
  resource?: AuthResource,
): Promise<void> {
  await authorize({
    user: { id: requireUserId(user), role: user.role, name: user.name },
    permission,
    resource,
    message,
  });
}

/** Lanza si el usuario no tiene ninguno de los permisos indicados. */
export async function assertAnyPermission(
  user: PermissionSubject,
  permissions: Permission[],
  message?: string,
  resource?: AuthResource,
): Promise<void> {
  await authorize({
    user: { id: requireUserId(user), role: user.role, name: user.name },
    permissions,
    resource,
    message,
  });
}

/**
 * Autoriza una acción sobre un recurso propio o de la entidad.
 * `anyPermission` debe ser alcance :org; `ownPermission` alcance :own.
 */
export async function assertOwnOrAnyPermission(
  user: PermissionSubject,
  opts: {
    anyPermission: Permission;
    ownPermission: Permission;
    isOwner: boolean;
    organizationId?: string | null;
    organizerId?: string | null;
    ownerUserId?: string | null;
    resourceId?: string;
    resourceType?: AuthResource["type"];
    message?: string;
  },
): Promise<void> {
  const userId = requireUserId(user);
  const role = normalizeRole(user.role);

  await authorize({
    user: { id: userId, role, name: user.name },
    permissions: [opts.anyPermission, opts.ownPermission],
    resource: {
      type: opts.resourceType ?? "event",
      id: opts.resourceId,
      organizationId: opts.organizationId,
      organizerId: opts.organizerId ?? (opts.isOwner ? userId : null),
      ownerUserId: opts.ownerUserId ?? (opts.isOwner ? userId : null),
    },
    message: opts.message,
  });
}
