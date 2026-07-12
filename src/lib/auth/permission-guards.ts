import { hasEffectivePermission } from "./effective-permissions";
import { normalizeRole, type Permission } from "./rbac";

/** Sujeto mínimo para evaluar permisos: solo se necesita el rol. */
type PermissionSubject = { role?: string | null };

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
  user: PermissionSubject,
  permission: Permission,
): Promise<boolean> {
  return hasEffectivePermission(user.role, permission);
}

/** `true` si el usuario tiene al menos uno de los permisos. */
export async function canAny(
  user: PermissionSubject,
  permissions: Permission[],
): Promise<boolean> {
  for (const permission of permissions) {
    if (await hasEffectivePermission(user.role, permission)) return true;
  }
  return false;
}

/** Lanza `PermissionError` si el usuario no tiene el permiso efectivo. */
export async function assertPermission(
  user: PermissionSubject,
  permission: Permission,
  message?: string,
): Promise<void> {
  if (!(await hasEffectivePermission(user.role, permission))) {
    throw new PermissionError(message);
  }
}

/** Lanza si el usuario no tiene ninguno de los permisos indicados. */
export async function assertAnyPermission(
  user: PermissionSubject,
  permissions: Permission[],
  message?: string,
): Promise<void> {
  if (!(await canAny(user, permissions))) {
    throw new PermissionError(message);
  }
}

/**
 * Autoriza una acción sobre un recurso que puede ser "propio" o "de cualquiera".
 * - admin/organizer: `anyPermission` o (`ownPermission` + dueño)
 * - super_admin: solo si es dueño (ve plataforma; muta solo lo que creó)
 */
export async function assertOwnOrAnyPermission(
  user: PermissionSubject,
  opts: {
    anyPermission: Permission;
    ownPermission: Permission;
    isOwner: boolean;
    message?: string;
  },
): Promise<void> {
  const role = normalizeRole(user.role);

  if (role === "super_admin") {
    if (opts.isOwner) return;
    throw new PermissionError(
      opts.message ??
        "Como superadmin solo puedes modificar recursos de eventos que creaste.",
    );
  }

  if (await hasEffectivePermission(user.role, opts.anyPermission)) return;
  if (opts.isOwner && (await hasEffectivePermission(user.role, opts.ownPermission))) {
    return;
  }
  throw new PermissionError(opts.message);
}
