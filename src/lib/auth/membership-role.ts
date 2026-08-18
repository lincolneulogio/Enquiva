import type { AppRole } from "./rbac";

export type MembershipRole = "owner" | "organizer" | "member" | "scanner";

export function isMembershipRole(value: string): value is MembershipRole {
  return value === "owner" || value === "organizer" || value === "member" || value === "scanner";
}

/** Rol de aplicación que corresponde a una membresía de entidad. */
export function appRoleFromMembershipRole(membershipRole: MembershipRole): AppRole {
  if (membershipRole === "owner") return "admin";
  if (membershipRole === "organizer") return "organizer";
  if (membershipRole === "scanner") return "scanner";
  return "member";
}

/**
 * Rol efectivo en una entidad: el dueño es admin ahí aunque la fila
 * de membresía esté desfasada (`organizer`).
 */
export function appRoleForOrganizationContext(input: {
  userId: string;
  organizationOwnerId: string;
  membershipRole: MembershipRole;
}): AppRole {
  if (input.userId === input.organizationOwnerId) return "admin";
  return appRoleFromMembershipRole(input.membershipRole);
}

/**
 * Al activar o cambiar una membresía, `users.role` / `users.organizationId`
 * solo se tocan si el usuario no tiene contexto o ya está en esa entidad.
 * Así no se le “roba” el panel de la otra org.
 */
export function shouldApplyMembershipToUserRecord(
  currentOrganizationId: string | null | undefined,
  membershipOrganizationId: string,
): boolean {
  return !currentOrganizationId || currentOrganizationId === membershipOrganizationId;
}
