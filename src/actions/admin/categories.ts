"use server";

import { db } from "@/lib/db";
import { categories, events } from "@/lib/db/schema";
import type { Category } from "@/lib/db/schema";
import { eq, asc, sql as sqlExpr } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "./users";
import { assertAnyPermission } from "@/lib/auth/permission-guards";
import { logAdminAction } from "@/lib/analytics/log-admin-action";
import { normalizeCategorySlug } from "@/lib/utils";
import { ensureDefaultPlatformCategories } from "@/lib/events/category-bootstrap";

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

  const stats = await ensureDefaultPlatformCategories();
  revalidatePath("/admin/categories");
  revalidatePath("/superadmin/categories");

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

  const slug = normalizeCategorySlug(input.slug);
  if (!slug) {
    throw new Error("El slug es obligatorio y solo puede usar letras minúsculas, números y guiones bajos");
  }
  if (!/^[a-z0-9_]+$/.test(slug)) {
    throw new Error("El slug solo puede contener letras minúsculas, números y guiones bajos");
  }

  const [existing] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.slug, slug))
    .limit(1);
  if (existing) {
    throw new Error("Ya existe una categoría con ese slug");
  }

  const [created] = await db
    .insert(categories)
    .values({
      slug,
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

  await db
    .update(categories)
    .set({
      ...(input.label !== undefined && { label: input.label.trim() }),
      ...(input.description !== undefined && { description: input.description.trim() }),
      ...(input.colorClass !== undefined && { colorClass: input.colorClass }),
      ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
      updatedAt: new Date(),
    })
    .where(eq(categories.id, id));

  await logAdminAction({
    actorId: user.id,
    actorName: user.name ?? user.email,
    action: "category.update",
    entityType: "category",
    entityId: id,
    details: `Categoría actualizada: ${cat.label} (${cat.slug})`,
  });

  revalidatePath("/admin/categories");
  revalidatePath("/superadmin/categories");
  return { success: true };
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
  return { success: true };
}
