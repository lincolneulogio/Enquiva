"use server";

import { db } from "@/lib/db";
import { eventTypes, events, categories, eventTypeSlugAliases } from "@/lib/db/schema";
import { eq, and, asc, ne, isNull, sql as sqlExpr } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "./users";
import { assertAnyPermission } from "@/lib/auth/permission-guards";
import { logAdminAction } from "@/lib/analytics/log-admin-action";
import { ensureDefaultEventTypes } from "@/lib/events/event-types-bootstrap";
import { invalidateTaxonomyCache } from "@/lib/events/taxonomy-cache";
import { normalizeCategorySlug } from "@/lib/utils";

async function nextAvailableEventTypeSlug(
  categorySlug: string,
  baseSlug: string,
  excludeId?: string,
) {
  for (let suffix = 1; suffix <= 100; suffix += 1) {
    const slug = suffix === 1 ? baseSlug : `${baseSlug}_${suffix}`;
    const conditions = [eq(eventTypes.categorySlug, categorySlug), eq(eventTypes.slug, slug)];
    if (excludeId) conditions.push(ne(eventTypes.id, excludeId));

    const [existing] = await db
      .select({ id: eventTypes.id })
      .from(eventTypes)
      .where(and(...conditions))
      .limit(1);

    if (existing) continue;

    // Evita reutilizar un slug histórico que siga activo como alias.
    const [alias] = await db
      .select({ id: eventTypeSlugAliases.id })
      .from(eventTypeSlugAliases)
      .where(
        and(
          eq(eventTypeSlugAliases.categorySlug, categorySlug),
          eq(eventTypeSlugAliases.slug, slug),
        ),
      )
      .limit(1);

    if (!alias) return slug;
  }

  throw new Error("No se pudo generar un slug único para el tipo de evento");
}

// ─── Queries públicas ─────────────────────────────────────────────────────────

/**
 * Devuelve todos los tipos de evento activos de la BD, opcionalmente filtrados
 * por categoría. Usado en el formulario de evento.
 */
export async function getEventTypes(
  categorySlug?: string,
): Promise<Array<{ id: string; slug: string; label: string; labelEn: string | null; categorySlug: string; sortOrder: number }>> {
  await ensureDefaultEventTypes();
  const conditions = [eq(eventTypes.isActive, true)];
  if (categorySlug) conditions.push(eq(eventTypes.categorySlug, categorySlug));

  return db
    .select({
      id: eventTypes.id,
      slug: eventTypes.slug,
      label: eventTypes.label,
      labelEn: eventTypes.labelEn,
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

const slug = normalizeCategorySlug(input.label) || normalizeCategorySlug(input.slug);
  if (!slug) throw new Error("El slug es obligatorio");
  if (!input.label.trim()) throw new Error("La etiqueta es obligatoria");

  const [category] = await db
    .select({ id: categories.id, isActive: categories.isActive })
    .from(categories)
    .where(and(isNull(categories.organizationId), eq(categories.slug, input.categorySlug)))
    .limit(1);
  if (!category) throw new Error("La categoría seleccionada no existe");
  if (!category.isActive) throw new Error("No se pueden crear tipos en una categoría inactiva");

  const uniqueSlug = await nextAvailableEventTypeSlug(input.categorySlug, slug);

  const [created] = await db
    .insert(eventTypes)
    .values({
      categorySlug: input.categorySlug,
      slug: uniqueSlug,
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
  await invalidateTaxonomyCache();
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

  const nextLabel = input.label?.trim();
  if (input.label !== undefined && !nextLabel) {
    throw new Error("La etiqueta es obligatoria");
  }
  const shouldRenameSlug = nextLabel !== undefined && nextLabel !== et.label;
  const normalizedNextSlug = shouldRenameSlug ? normalizeCategorySlug(nextLabel) : et.slug;
  if (shouldRenameSlug && !normalizedNextSlug) {
    throw new Error("La etiqueta debe incluir letras o números para generar el slug");
  }
  const nextSlug = shouldRenameSlug
    ? await nextAvailableEventTypeSlug(et.categorySlug, normalizedNextSlug, id)
    : et.slug;

const [updated] = await db.transaction(async (tx) => {
    const [updatedType] = await tx
      .update(eventTypes)
      .set({
        ...(nextLabel !== undefined && { label: nextLabel }),
        ...(input.description !== undefined && { description: input.description.trim() }),
        ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
        ...(shouldRenameSlug && { slug: nextSlug }),
        updatedAt: new Date(),
      })
      .where(eq(eventTypes.id, id))
      .returning();

    // Historial: el slug anterior queda como alias para que los filtros
    // públicos con el slug viejo sigan resolviendo a este tipo.
    if (shouldRenameSlug && et.slug !== nextSlug) {
      await tx
        .insert(eventTypeSlugAliases)
        .values({ eventTypeId: id, categorySlug: et.categorySlug, slug: et.slug })
        .onConflictDoNothing();
    }

    return [updatedType];
  });

  await logAdminAction({
    actorId: user.id,
    actorName: user.name ?? user.email,
    action: "event_type.update",
    entityType: "event_type",
    entityId: id,
    details: `Tipo actualizado: ${updated.label} (${updated.slug})`,
  });

  revalidatePath("/superadmin/event-types");
  revalidatePath("/admin/event-types");
revalidatePath("/admin/events/new");
  revalidatePath("/organizer/events/new");
  await invalidateTaxonomyCache();
  return { success: true, eventType: updated };
}

/**
 * Elimina un tipo de evento (solo si no hay eventos que lo usen).
 */
export async function deleteEventType(id: string) {
  const user = await requireSuperAdmin();
  await assertAnyPermission(user, ["categories:manage:platform"]);

  const [et] = await db.select().from(eventTypes).where(eq(eventTypes.id, id)).limit(1);
  if (!et) throw new Error("Tipo de evento no encontrado");

  // No se elimina un tipo en uso: con FK ON DELETE SET NULL se perdería la
  // clasificación de esos eventos. Preferir desactivarlo (isActive=false).
  const [{ cnt }] = await db
    .select({ cnt: sqlExpr<number>`count(*)::int` })
    .from(events)
    .where(eq(events.eventTypeId, id));

  if (cnt > 0) {
    throw new Error(
      `No se puede eliminar — ${cnt} evento(s) usan este tipo. Desactívalo o reasigna los eventos.`,
    );
  }

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
  await invalidateTaxonomyCache();
  return { success: true };
}

/**
 * Sincroniza/siembra los tipos de evento predeterminados desde la taxonomía.
 */
export async function syncDefaultEventTypesAction() {
  const user = await requireSuperAdmin();
  await assertAnyPermission(user, ["categories:manage:platform"]);

  const stats = await ensureDefaultEventTypes({ fillMissing: true });
  revalidatePath("/superadmin/event-types");
  revalidatePath("/admin/event-types");
  revalidatePath("/admin/events/new");
  revalidatePath("/organizer/events/new");
  await invalidateTaxonomyCache();
  return { success: true, inserted: stats.inserted, total: stats.total };
}
