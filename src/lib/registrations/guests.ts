import { eq, inArray } from "drizzle-orm";
import type { DBTransaction } from "@/lib/db";
import { db } from "@/lib/db";
import { registrations } from "@/lib/db/schema";

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
