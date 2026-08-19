import { cache } from "react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sessions, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { normalizeRole } from "@/lib/auth/rbac";
import { getRequestHeaders, getRequestSession } from "@/lib/request-context";

export type SessionUser = NonNullable<
  Awaited<ReturnType<typeof auth.api.getSession>>
>["user"];

export type AuthenticatedContext = {
  user: SessionUser;
  headers: Headers;
};

export class AuthError extends Error {
  status: number;

  constructor(message: string, status = 401) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

const readSession = cache(async () => {
  const requestHeaders = await getRequestHeaders();
  const session = await getRequestSession();
  return { session, headers: requestHeaders };
});

/** isActive desde sesión o BD (una query cacheada por request). */
const resolveUserActive = cache(async (userId: string, sessionFlag?: boolean | null) => {
  if (sessionFlag === false) return false;
  if (sessionFlag === true) return true;

  const [row] = await db
    .select({ isActive: users.isActive })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return row?.isActive !== false;
});

function assertRole(user: SessionUser, allowed: readonly string[], message = "Forbidden") {
  const role = user.role ?? "member";
  if (!allowed.includes(role)) throw new AuthError(message, 403);
}

async function assertActiveUser(user: SessionUser): Promise<SessionUser> {
  const active = await resolveUserActive(user.id, user.isActive);
  if (!active) {
    throw new AuthError("ACCOUNT_DISABLED", 403);
  }
  return user;
}

/** Sesión válida; devuelve el usuario autenticado y activo. */
export async function requireAuth(): Promise<SessionUser> {
  const { session } = await readSession();
  if (!session?.user) throw new AuthError("Unauthorized", 401);
  return assertActiveUser(session.user);
}

/** @deprecated Usar requireAuth */
export async function requireAuthUser(): Promise<SessionUser> {
  return requireAuth();
}

/** Sesión + headers (auditoría, IP, user-agent). */
export async function requireAuthWithHeaders(): Promise<AuthenticatedContext> {
  const { session, headers: requestHeaders } = await readSession();
  if (!session?.user) throw new AuthError("Unauthorized", 401);
  const user = await assertActiveUser(session.user);
  return { user, headers: requestHeaders };
}

/** organizer | admin | super_admin */
export async function requireOrganizerOrHigher(): Promise<SessionUser> {
  const user = await requireAuth();
  assertRole(user, ["organizer", "admin", "super_admin"]);
  return user;
}

/** organizer | admin | super_admin — con headers. */
export async function requireOrganizerOrHigherWithHeaders(): Promise<AuthenticatedContext> {
  const ctx = await requireAuthWithHeaders();
  assertRole(ctx.user, ["organizer", "admin", "super_admin"]);
  return ctx;
}

/** @deprecated Usar requireOrganizerOrHigher */
export async function requireOrganizerOrStaff(): Promise<SessionUser> {
  return requireOrganizerOrHigher();
}

/** Solo organizadores de eventos y super_admin (no administradores de entidad). */
export async function requireOrganizer(): Promise<SessionUser> {
  const user = await requireAuth();
  assertRole(
    user,
    ["organizer", "super_admin"],
    "Solo los organizadores de eventos pueden realizar esta acción. Si eres administrador de entidad, asigna el rol organizador en tu equipo o regístrate como organizador.",
  );
  return user;
}

/** Membresía de entidad pendiente de aprobación (null si no aplica o ya está activa). */
export async function getOrganizerPendingApproval(user: SessionUser) {
  if (normalizeRole(user.role) === "super_admin") return null;

  const { OrganizationService } = await import("@/lib/organizations/organization.service");
  return OrganizationService.getPendingOrganizerMembershipForUser(user.id);
}

/** Organizador con estado de aprobación (lecturas que no deben lanzar si está pendiente). */
export async function requireOrganizerWithApprovalState(): Promise<{
  user: SessionUser;
  pending: Awaited<ReturnType<typeof getOrganizerPendingApproval>>;
}> {
  const user = await requireOrganizer();
  const pending = await getOrganizerPendingApproval(user);
  return { user, pending };
}

/** Organizador con membresía de entidad aprobada (o sin entidad). Bloquea creación de eventos si está pendiente. */
export async function requireApprovedOrganizer(): Promise<SessionUser> {
  const { user, pending } = await requireOrganizerWithApprovalState();
  if (pending) {
    throw new AuthError("ORGANIZER_APPROVAL_PENDING", 403);
  }
  return user;
}

/**
 * Gestión de eventos: organizer (aprobado) | admin de entidad | super_admin.
 */
export async function requireApprovedEventManager(): Promise<SessionUser> {
  const user = await requireOrganizerOrHigher();
  if (normalizeRole(user.role) === "organizer") {
    const pending = await getOrganizerPendingApproval(user);
    if (pending) throw new AuthError("ORGANIZER_APPROVAL_PENDING", 403);
  }
  return user;
}

/** @deprecated Usar requireOrganizer — medios de pago del organizador. */
export async function requireOrganizerRole(): Promise<SessionUser> {
  return requireOrganizer();
}

/** @deprecated Usar requireOrganizerOrHigher */
export async function requireEventManager(): Promise<SessionUser> {
  return requireOrganizerOrHigher();
}

/** admin | super_admin */
export async function requireAdminOrHigher(): Promise<SessionUser> {
  const user = await requireAuth();
  assertRole(user, ["admin", "super_admin"]);
  return user;
}

/** admin | super_admin — con headers. */
export async function requireAdminOrHigherWithHeaders(): Promise<AuthenticatedContext> {
  const ctx = await requireAuthWithHeaders();
  assertRole(ctx.user, ["admin", "super_admin"]);
  return ctx;
}

/** @deprecated Usar requireAdminOrHigher */
export async function requireAdminOrSuper(): Promise<SessionUser> {
  return requireAdminOrHigher();
}

/** Solo super_admin de plataforma. */
export async function requireSuperAdmin(): Promise<SessionUser> {
  const user = await requireAuth();
  if (normalizeRole(user.role) !== "super_admin") throw new AuthError("Forbidden", 403);
  return user;
}

/** Invalida todas las sesiones del usuario (p. ej. al suspender la cuenta). */
export async function revokeUserSessions(userId: string) {
  await db.delete(sessions).where(eq(sessions.userId, userId));
}
