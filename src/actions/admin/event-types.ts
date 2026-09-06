"use server";

import { db } from "@/lib/db";
import { eventTypes } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "./users";
import { assertAnyPermission } from "@/lib/auth/permission-guards";
import { logAdminAction } from "@/lib/analytics/log-admin-action";
import { ensureDefaultEventTypes } from "@/lib/events/event-types-bootstrap";

// ─── Queries públicas ─────────────────────────────────────────────────────────

/**
 * Devuelve todos los tipos de evento activos de la BD, opcionalmente filtrados
 * por categoría. Usado en el formulario de evento.
 */
export async function getEventTypes(
  categorySlug?: string,
): Promise<Array<{ id: string; slug: string; label: string; categorySlug: string; sortOrder: number }>> {
  await ensureDefaultEventTypes();
  const conditions = [eq(eventTypes.isActive, true)];
  if (categorySlug) conditions.push(eq(eventTypes.categorySlug, categorySlug));

  return db
    .select({
      id: eventTypes.id,
      slug: eventTypes.slug,
      label: eventTypes.label,
      categorySlug: eventTypes.categorySlug,
      sortOrder: eventTypes.sortOrder,
    })
    .from(eventTypes)
    .where(and(...conditions))
    .orderBy(asc(eventTypes.categorySlug), asc(eventTypes.sortOrder), asc(eventTypes.label));
}

// ─── Superadmin CRUD ──────────────────────────────────────────────────────────

/**
 * Obtiene todos los tipos de evento (activos e inactivos) para el panel superadmin.
 */
export async function getAllEventTypes() {
  const user = await requireSuperAdmin();
  await assertAnyPermission(user, ["categories:manage:platform"]);

  return db
    .select()
    .from(eventTypes)
    .orderBy(asc(eventTypes.categorySlug), asc(eventTypes.sortOrder), asc(eventTypes.label));
}

/**
 * Crea un nuevo tipo de evento.
 */
export async function createEventType(input: {
  categorySlug: string;
  slug: string;
  label: string;
  description?: string;
  sortOrder?: number;
}) {
  const user = await requireSuperAdmin();
  await assertAnyPermission(user, ["categories:manage:platform"]);

  const slug = input.slug.toLowerCase().trim().replace(/[\s-]+/g, "_").replace(/[^a-z0-9_]/g, "");
  if (!slug) throw new Error("El slug es obligatorio");

  const [existing] = await db
    .select({ id: eventTypes.id })
    .from(eventTypes)
    .where(and(eq(eventTypes.categorySlug, input.categorySlug), eq(eventTypes.slug, slug)))
    .limit(1);

  if (existing) throw new Error("Ya existe un tipo con ese slug para esta categoría");

  const [created] = await db
    .insert(eventTypes)
    .values({
      categorySlug: input.categorySlug,
      slug,
      label: input.label.trim(),
      description: input.description?.trim() ?? null,
      sortOrder: input.sortOrder ?? 99,
      isActive: true,
      createdBy: user.id,
    })
    .returning();

  await logAdminAction({
    actorId: user.id,
    actorName: user.name ?? user.email,
    action: "event_type.create",
    entityType: "event_type",
    entityId: created.id,
    details: `Tipo creado: ${created.label} (${created.slug}) en ${created.categorySlug}`,
  });

  revalidatePath("/superadmin/event-types");
  revalidatePath("/admin/event-types");
  revalidatePath("/admin/events/new");
  revalidatePath("/organizer/events/new");
  return { success: true, eventType: created };
}

/**
 * Actualiza un tipo de evento existente.
 */
export async function updateEventType(
  id: string,
  input: {
    label?: string;
    description?: string;
    sortOrder?: number;
    isActive?: boolean;
  },
) {
  const user = await requireSuperAdmin();
  await assertAnyPermission(user, ["categories:manage:platform"]);

  const [et] = await db.select().from(eventTypes).where(eq(eventTypes.id, id)).limit(1);
  if (!et) throw new Error("Tipo de evento no encontrado");

  await db
    .update(eventTypes)
    .set({
      ...(input.label !== undefined && { label: input.label.trim() }),
      ...(input.description !== undefined && { description: input.description.trim() }),
      ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
      updatedAt: new Date(),
    })
    .where(eq(eventTypes.id, id));

  await logAdminAction({
    actorId: user.id,
    actorName: user.name ?? user.email,
    action: "event_type.update",
    entityType: "event_type",
    entityId: id,
    details: `Tipo actualizado: ${et.label} (${et.slug})`,
  });

  revalidatePath("/superadmin/event-types");
  revalidatePath("/admin/event-types");
  revalidatePath("/admin/events/new");
  revalidatePath("/organizer/events/new");
  return { success: true };
}

/**
 * Elimina un tipo de evento (solo si no hay eventos que lo usen).
 */
export async function deleteEventType(id: string) {
  const user = await requireSuperAdmin();
  await assertAnyPermission(user, ["categories:manage:platform"]);

  const [et] = await db.select().from(eventTypes).where(eq(eventTypes.id, id)).limit(1);
  if (!et) throw new Error("Tipo de evento no encontrado");

  // No verificamos eventos existentes que usen este slug (campo libre de texto),
  // pero dejamos un log para auditoría.
  await db.delete(eventTypes).where(eq(eventTypes.id, id));

  await logAdminAction({
    actorId: user.id,
    actorName: user.name ?? user.email,
    action: "event_type.delete",
    entityType: "event_type",
    entityId: id,
    details: `Tipo eliminado: ${et.label} (${et.slug}) de ${et.categorySlug}`,
  });

  revalidatePath("/superadmin/event-types");
  revalidatePath("/admin/event-types");
  revalidatePath("/admin/events/new");
  revalidatePath("/organizer/events/new");
  return { success: true };
}

/**
 * Sincroniza/siembra los tipos de evento predeterminados desde la taxonomía.
 */
export async function syncDefaultEventTypesAction() {
  const user = await requireSuperAdmin();
  await assertAnyPermission(user, ["categories:manage:platform"]);

  const stats = await ensureDefaultEventTypes();
  revalidatePath("/superadmin/event-types");
  revalidatePath("/admin/event-types");
  revalidatePath("/admin/events/new");
  revalidatePath("/organizer/events/new");
  return { success: true, inserted: stats.inserted, total: stats.total };
}
