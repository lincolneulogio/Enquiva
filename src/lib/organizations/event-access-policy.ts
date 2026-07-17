import { normalizeRole } from "@/lib/auth/rbac";

export type EventAccessContext = {
  organizerId: string;
  organizationId: string | null;
  registeredUserIds?: readonly string[];
};

/**
 * Política pura para canales privados de evento.
 * Los administradores quedan estrictamente limitados a su entidad.
 */
export function canAccessEventRealtime(
  event: EventAccessContext,
  user: {
    id: string;
    role?: string | null;
    organizationId?: string | null;
  },
): boolean {
  const role = normalizeRole(user.role);

  if (role === "super_admin") return true;
  if (role === "organizer") return event.organizerId === user.id;
  if (role === "admin") {
    return Boolean(
      user.organizationId &&
        event.organizationId &&
        user.organizationId === event.organizationId,
    );
  }

  return event.registeredUserIds?.includes(user.id) ?? false;
}
