"use server";

import { db } from "@/lib/db";
import { categories, events, eventTypes, categorySlugAliases, eventTypeSlugAliases } from "@/lib/db/schema";
import type { Category } from "@/lib/db/schema";
import { and, asc, eq, isNull, ne, sql as sqlExpr } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "./users";
import { assertAnyPermission } from "@/lib/auth/permission-guards";
import { logAdminAction } from "@/lib/analytics/log-admin-action";
import { normalizeCategorySlug } from "@/lib/utils";
import { ensureDefaultPlatformCategories } from "@/lib/events/category-bootstrap";
import { invalidateTaxonomyCache } from "@/lib/events/taxonomy-cache";

async function nextAvailablePlatformCategorySlug(
  baseSlug: string,
  excludeId?: string,
) {
  for (let suffix = 1; suffix <= 100; suffix += 1) {
    const slug = suffix === 1 ? baseSlug : `${baseSlug}_${suffix}`;
    const conditions = [eq(categories.slug, slug), isNull(categories.organizationId)];
    if (excludeId) conditions.push(ne(categories.id, excludeId));

    const [existing] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(and(...conditions))
      .limit(1);

    if (existing) continue;

    // Un slug histórico (alias) tampoco debe reutilizarse mientras siga activo:
    // reintroducirlo haría ambiguas las URLs que apuntaban a la categoría anterior.
    const [alias] = await db
      .select({ id: categorySlugAliases.id })
      .from(categorySlugAliases)
      .where(eq(categorySlugAliases.slug, slug))
      .limit(1);

    if (!alias) return slug;
  }

  throw new Error("No se pudo generar un slug único para la categoría");
}

/**
 * Obtiene todas las categorías para administración de plataforma.
 * Exclusivo para el superadministrador.
 */
export async function getAllCategories(): Promise<Category[]> {
  const user = await requireSuperAdmin();
  await assertAnyPermission(user, ["categories:manage:platform"]);

  await ensureDefaultPlatformCategories();

  return db
    .select()
    .from(categories)
    .orderBy(asc(categories.sortOrder));
}

/**
 * Sincroniza e inserta las categorías por defecto que falten en la base de datos.
 */
export async function syncDefaultCategoriesAction() {
  const user = await requireSuperAdmin();
  await assertAnyPermission(user, ["categories:manage:platform"]);

const stats = await ensureDefaultPlatformCategories({ fillMissing: true });
  revalidatePath("/admin/categories");
  revalidatePath("/superadmin/categories");
  await invalidateTaxonomyCache();

  return {
    success: true,
    inserted: stats.inserted,
    total: stats.total,
    categories: await db.select().from(categories).orderBy(asc(categories.sortOrder)),
  };
}

/**
 * Crea una nueva categoría en la plataforma.
 * Exclusivo para el superadministrador.
 */
export async function createCategory(input: {
  slug: string;
  label: string;
  description?: string;
  colorClass?: string;
  sortOrder?: number;
}) {
  const user = await requireSuperAdmin();
  await assertAnyPermission(user, ["categories:manage:platform"]);

  const slug = normalizeCategorySlug(input.label) || normalizeCategorySlug(input.slug);
  if (!slug) {
    throw new Error("El slug es obligatorio y solo puede usar letras minúsculas, números y guiones bajos");
  }
  if (!input.label.trim()) {
    throw new Error("La etiqueta es obligatoria");
  }

  const uniqueSlug = await nextAvailablePlatformCategorySlug(slug);

  const [created] = await db
    .insert(categories)
    .values({
      slug: uniqueSlug,
      label: input.label.trim(),
      description: input.description?.trim() ?? null,
      colorClass: input.colorClass ?? "bg-gray-100 text-gray-800",
      sortOrder: input.sortOrder ?? 99,
      createdBy: user.id,
      organizationId: null, // Categoría a nivel de plataforma
      isActive: true,
    })
    .returning();

  await logAdminAction({
    actorId: user.id,
    actorName: user.name ?? user.email,
    action: "category.create",
    entityType: "category",
    entityId: created.id,
    details: `Categoría creada: ${created.label} (${created.slug})`,
  });

  revalidatePath("/admin/categories");
  revalidatePath("/superadmin/categories");
  await invalidateTaxonomyCache();
  return { success: true, category: created };
}

/**
 * Actualiza una categoría existente.
 * Exclusivo para el superadministrador.
 */
export async function updateCategory(
  id: string,
  input: {
    label?: string;
    description?: string;
    colorClass?: string;
    sortOrder?: number;
    isActive?: boolean;
  },
) {
  const user = await requireSuperAdmin();
  await assertAnyPermission(user, ["categories:manage:platform"]);

  const [cat] = await db
    .select()
    .from(categories)
    .where(eq(categories.id, id))
    .limit(1);
  if (!cat) throw new Error("Category not found");

  const nextLabel = input.label?.trim();
  if (input.label !== undefined && !nextLabel) {
    throw new Error("La etiqueta es obligatoria");
  }

  const shouldRenameSlug = nextLabel !== undefined && nextLabel !== cat.label;
  const normalizedNextSlug = shouldRenameSlug ? normalizeCategorySlug(nextLabel) : cat.slug;
  if (shouldRenameSlug && !normalizedNextSlug) {
    throw new Error("La etiqueta debe incluir letras o números para generar el slug");
  }
  const nextSlug = shouldRenameSlug
    ? await nextAvailablePlatformCategorySlug(normalizedNextSlug, id)
    : cat.slug;

  const [updated] = await db.transaction(async (tx) => {
    const [updatedCategory] = await tx
      .update(categories)
      .set({
        ...(nextLabel !== undefined && { label: nextLabel }),
        ...(input.description !== undefined && { description: input.description.trim() }),
        ...(input.colorClass !== undefined && { colorClass: input.colorClass }),
        ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
        ...(shouldRenameSlug && { slug: nextSlug }),
        updatedAt: new Date(),
      })
      .where(eq(categories.id, id))
      .returning();

if (shouldRenameSlug) {
      await tx
        .update(events)
        .set({ category: nextSlug, updatedAt: new Date() })
        .where(eq(events.category, cat.slug));
      await tx
        .update(eventTypes)
        .set({ categorySlug: nextSlug, updatedAt: new Date() })
        .where(eq(eventTypes.categorySlug, cat.slug));

      // Historial: el slug anterior queda como alias para no romper enlaces/filtros.
      if (cat.slug !== nextSlug) {
        await tx
          .insert(categorySlugAliases)
          .values({ categoryId: id, slug: cat.slug })
          .onConflictDoNothing();
        // Los alias de tipos registrados bajo el slug anterior se re-encuadran
        // en el slug actual de la categoría para que sigan resolviéndose.
        await tx
          .update(eventTypeSlugAliases)
          .set({ categorySlug: nextSlug })
          .where(eq(eventTypeSlugAliases.categorySlug, cat.slug));
      }
    }

    return [updatedCategory];
  });

  await logAdminAction({
    actorId: user.id,
    actorName: user.name ?? user.email,
    action: "category.update",
    entityType: "category",
    entityId: id,
    details: `Categoría actualizada: ${updated.label} (${updated.slug})`,
  });

revalidatePath("/admin/categories");
  revalidatePath("/superadmin/categories");
  await invalidateTaxonomyCache();
  return { success: true, category: updated };
}

/**
 * Elimina una categoría.
 * Exclusivo para el superadministrador.
 */
export async function deleteCategory(id: string) {
  const user = await requireSuperAdmin();
  await assertAnyPermission(user, ["categories:manage:platform"]);

  const [cat] = await db
    .select()
    .from(categories)
    .where(eq(categories.id, id))
    .limit(1);
  if (!cat) throw new Error("Category not found");

  const [{ cnt }] = await db
    .select({ cnt: sqlExpr<number>`count(*)::int` })
    .from(events)
    .where(eq(events.category, cat.slug));

  if (cnt > 0) {
    throw new Error(`No se puede eliminar — ${cnt} evento(s) usan esta categoría`);
  }

  await db.delete(categories).where(eq(categories.id, id));

  await logAdminAction({
    actorId: user.id,
    actorName: user.name ?? user.email,
    action: "category.delete",
    entityType: "category",
    entityId: id,
    details: `Categoría eliminada: ${cat.label} (${cat.slug})`,
  });

  revalidatePath("/admin/categories");
  revalidatePath("/superadmin/categories");
  await invalidateTaxonomyCache();
  return { success: true };
}

/**
 * Reordena las categorías.
 * Exclusivo para el superadministrador.
 */
export async function reorderCategories(orderedIds: string[]) {
  const user = await requireSuperAdmin();
  await assertAnyPermission(user, ["categories:manage:platform"]);

  if (!orderedIds.length) {
    return { success: true };
  }

  await db.transaction(async (tx) => {
    for (let i = 0; i < orderedIds.length; i += 1) {
      await tx
        .update(categories)
        .set({ sortOrder: i + 1, updatedAt: new Date() })
        .where(eq(categories.id, orderedIds[i]));
    }
  });

  await logAdminAction({
    actorId: user.id,
    actorName: user.name ?? user.email,
    action: "category.reorder",
    entityType: "category",
    entityId: "platform",
    details: `Reordenadas ${orderedIds.length} categorías`,
  });

  revalidatePath("/admin/categories");
  revalidatePath("/superadmin/categories");
  await invalidateTaxonomyCache();
  return { success: true };
}
