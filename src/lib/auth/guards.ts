import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { normalizeRole } from "@/lib/auth/rbac";

export type SessionUser = NonNullable<
  Awaited<ReturnType<typeof auth.api.getSession>>
>["user"];

export type AuthenticatedContext = {
  user: SessionUser;
  headers: Headers;
};

async function readSession() {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  return { session, headers: requestHeaders };
}

function assertRole(user: SessionUser, allowed: readonly string[], message = "Forbidden") {
  const role = user.role ?? "member";
  if (!allowed.includes(role)) throw new Error(message);
}

/** Sesión válida; devuelve el usuario autenticado. */
export async function requireAuth(): Promise<SessionUser> {
  const { session } = await readSession();
  if (!session?.user) throw new Error("Unauthorized");
  return session.user;
}

/** Alias histórico usado en billing. */
export async function requireAuthUser(): Promise<SessionUser> {
  return requireAuth();
}

/** Sesión + headers (auditoría, IP, user-agent). */
export async function requireAuthWithHeaders(): Promise<AuthenticatedContext> {
  const { session, headers: requestHeaders } = await readSession();
  if (!session?.user) throw new Error("Unauthorized");
  return { user: session.user, headers: requestHeaders };
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

/** Alias usado en billing y eventos. */
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
    throw new Error("ORGANIZER_APPROVAL_PENDING");
  }
  return user;
}

/** organizer | super_admin — medios de pago del organizador (sin admin de entidad). */
export async function requireOrganizerRole(): Promise<SessionUser> {
  const user = await requireAuth();
  assertRole(user, ["organizer", "super_admin"]);
  return user;
}

/** organizer | admin | super_admin — gestión de eventos/medios por evento. */
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

/** Alias usado en acciones admin. */
export async function requireAdminOrSuper(): Promise<SessionUser> {
  return requireAdminOrHigher();
}

/** Solo super_admin de plataforma. */
export async function requireSuperAdmin(): Promise<SessionUser> {
  const user = await requireAuth();
  if (normalizeRole(user.role) !== "super_admin") throw new Error("Forbidden");
  return user;
}
