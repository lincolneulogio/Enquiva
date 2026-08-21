import { eq, inArray, sql } from "drizzle-orm";
import type { DBTransaction } from "@/lib/db";
import { db } from "@/lib/db";
import { registrations, registrationGuests, users } from "@/lib/db/schema";

const GUEST_NOTES_PREFIX = "[GUESTS:";

/** Legacy: IDs embebidos en notes del titular. */
export function parseGuestRegistrationIds(notes: string | null | undefined): string[] {
  if (!notes?.startsWith(GUEST_NOTES_PREFIX)) return [];
  const content = notes.slice(GUEST_NOTES_PREFIX.length).replace("]", "").trim();
  if (!content) return [];
  return content.split(",").map((id) => id.trim()).filter(Boolean);
}

/** Quita el prefijo legacy de notes para mostrar notas reales. */
export function stripGuestNotesPrefix(notes: string | null | undefined): string {
  if (!notes) return "";
  if (!notes.startsWith(GUEST_NOTES_PREFIX)) return notes;
  return notes.replace(/^\[GUESTS:[^\]]*\]/, "").trim();
}

type Queryable = typeof db | DBTransaction;

export function isGuestRegistration(reg: {
  guestId?: string | null;
  parentRegistrationId?: string | null;
  userId?: string | null;
  email?: string | null;
}): boolean {
  if (reg.guestId) return true;
  if (reg.parentRegistrationId) return true;
  if (reg.userId?.startsWith("guest_")) return true;
  if (reg.email?.startsWith("guest_") || reg.email?.includes("@sistemaevents.com")) {
    return true;
  }
  return false;
}

/**
 * Resuelve invitados: preferí FK parent_registration_id; fallback a notes legacy.
 */
export async function resolveGuestRegistrationIds(
  parent: { id: string; notes?: string | null },
  client: Queryable = db,
): Promise<string[]> {
  const children = await client
    .select({ id: registrations.id })
    .from(registrations)
    .where(eq(registrations.parentRegistrationId, parent.id));

  if (children.length > 0) {
    return children.map((c) => c.id);
  }

  return parseGuestRegistrationIds(parent.notes);
}

/** Un SELECT para todos los titulares; fallback a notes legacy. */
export async function resolveGuestIdsByParent(
  parents: Array<{ id: string; notes?: string | null }>,
  client: Queryable = db,
): Promise<Map<string, string[]>> {
  const result = new Map<string, string[]>();
  if (parents.length === 0) return result;

  const parentIds = parents.map((parent) => parent.id);
  const children = await client
    .select({
      id: registrations.id,
      parentRegistrationId: registrations.parentRegistrationId,
    })
    .from(registrations)
    .where(inArray(registrations.parentRegistrationId, parentIds));

  for (const child of children) {
    if (!child.parentRegistrationId) continue;
    const list = result.get(child.parentRegistrationId) ?? [];
    list.push(child.id);
    result.set(child.parentRegistrationId, list);
  }

  for (const parent of parents) {
    if (!result.has(parent.id)) {
      result.set(parent.id, parseGuestRegistrationIds(parent.notes));
    }
  }

  return result;
}

export function countGuestsFromNotes(notes: string | null | undefined): number {
  return parseGuestRegistrationIds(notes).length;
}

/** Nombre/email de display: usuario real o perfil de invitado. */
export async function resolveAttendeeDisplay(
  registrationId: string,
  client: Queryable = db,
): Promise<{ name: string; email: string | null; isGuest: boolean }> {
  const [row] = await client
    .select({
      userName: users.name,
      userEmail: users.email,
      guestName: registrationGuests.name,
      guestId: registrations.guestId,
      parentRegistrationId: registrations.parentRegistrationId,
      userId: registrations.userId,
    })
    .from(registrations)
    .leftJoin(users, eq(registrations.userId, users.id))
    .leftJoin(registrationGuests, eq(registrations.guestId, registrationGuests.id))
    .where(eq(registrations.id, registrationId))
    .limit(1);

  if (!row) {
    return { name: "Asistente", email: null, isGuest: false };
  }

  const isGuest = isGuestRegistration(row);
  return {
    name: row.guestName ?? row.userName ?? "Asistente",
    email: row.userEmail ?? null,
    isGuest,
  };
}

/** Fragmento SQL coalesce nombre asistente (user o guest). */
export const attendeeNameSql = sql<string>`coalesce(${registrationGuests.name}, ${users.name}, 'Asistente')`;
export const attendeeEmailSql = sql<string | null>`${users.email}`;
