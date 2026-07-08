"use server";

import { db } from "@/lib/db";
import { categories, events } from "@/lib/db/schema";
import type { Category } from "@/lib/db/schema";
import { eq, asc, and, sql as sqlExpr } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAdminOrSuper } from "./users";
import { assertPermission } from "@/lib/auth/permission-guards";
import {
  resolveAdminScopeForUser,
  scopeCategoryCondition,
  andWithScope,
} from "@/lib/organizations/admin-scope";
import { logAdminAction } from "@/lib/analytics/log-admin-action";
import { normalizeCategorySlug } from "@/lib/utils";

async function assertCategoryAccess(categoryId: string, userId: string, role: string | null | undefined) {
  const scope = await resolveAdminScopeForUser(userId, role);
  const [cat] = await db.select().from(categories).where(eq(categories.id, categoryId)).limit(1);
  if (!cat) throw new Error("Category not found");

  if (scope.mode === "org" && cat.organizationId !== scope.organizationId) {
    throw new Error("No autorizado para editar esta categoría");
  }
  return { cat, scope };
}

export async function getAllCategories(): Promise<Category[]> {
  const user = await requireAdminOrSuper();
  const scope = await resolveAdminScopeForUser(user.id, user.role);
  const orgFilter = scopeCategoryCondition(scope);

  return db
    .select()
    .from(categories)
    .where(orgFilter)
    .orderBy(asc(categories.sortOrder));
}

export async function createCategory(input: {
    slug: string;
    label: string;
    description?: string;
    colorClass?: string;
    sortOrder?: number;
}) {
    const user = await requireAdminOrSuper();
    await assertPermission(user, "categories:manage");
    const scope = await resolveAdminScopeForUser(user.id, user.role);
    const slug = normalizeCategorySlug(input.slug);
    if (!slug) throw new Error("El slug es obligatorio y solo puede usar letras minúsculas, números y guiones bajos");
    if (!/^[a-z0-9_]+$/.test(slug)) {
        throw new Error("El slug solo puede contener letras minúsculas, números y guiones bajos");
    }

    const organizationId = scope.mode === "org" ? scope.organizationId : null;

    const [existing] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(
        and(
          eq(categories.slug, slug),
          organizationId
            ? eq(categories.organizationId, organizationId)
            : sqlExpr`${categories.organizationId} IS NULL`,
        ),
      )
      .limit(1);
    if (existing) throw new Error("Ya existe una categoría con ese slug en tu entidad");

    const [created] = await db.insert(categories).values({
        slug,
        label: input.label.trim(),
        description: input.description?.trim() ?? null,
        colorClass: input.colorClass ?? "bg-gray-100 text-gray-800",
        sortOrder: input.sortOrder ?? 99,
        createdBy: user.id,
        organizationId,
    }).returning();
    await logAdminAction({
        actorId: user.id,
        actorName: user.name ?? user.email,
        action: "category.create",
        entityType: "category",
        entityId: created.id,
        details: `Categoría creada: ${created.label} (${created.slug})`,
    });
    revalidatePath("/admin/categories");
    return { success: true, category: created };
}

export async function updateCategory(id: string, input: {
    label?: string;
    description?: string;
    colorClass?: string;
    sortOrder?: number;
    isActive?: boolean;
}) {
    const user = await requireAdminOrSuper();
    await assertPermission(user, "categories:manage");
    const { cat } = await assertCategoryAccess(id, user.id, user.role);
    await db.update(categories).set({
        ...(input.label !== undefined && { label: input.label.trim() }),
        ...(input.description !== undefined && { description: input.description.trim() }),
        ...(input.colorClass !== undefined && { colorClass: input.colorClass }),
        ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
        updatedAt: new Date(),
    }).where(eq(categories.id, id));
    await logAdminAction({
        actorId: user.id,
        actorName: user.name ?? user.email,
        action: "category.update",
        entityType: "category",
        entityId: id,
        details: `Categoría actualizada: ${cat.label} (${cat.slug})`,
    });
    revalidatePath("/admin/categories");
    return { success: true };
}

export async function deleteCategory(id: string) {
    const user = await requireAdminOrSuper();
    await assertPermission(user, "categories:manage");
    const { cat } = await assertCategoryAccess(id, user.id, user.role);
    const [{ cnt }] = await db
        .select({ cnt: sqlExpr<number>`count(*)::int` })
        .from(events)
        .where(
          andWithScope(
            [eq(events.category, cat.slug)],
            cat.organizationId ? eq(events.organizationId, cat.organizationId) : undefined,
          ),
        );
    if (cnt > 0) throw new Error(`Cannot delete — ${cnt} event(s) use this category`);
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
    return { success: true };
}

export async function reorderCategories(orderedIds: string[]) {
    const user = await requireAdminOrSuper();
    await assertPermission(user, "categories:manage");
    const scope = await resolveAdminScopeForUser(user.id, user.role);

    if (!orderedIds.length) {
        return { success: true };
    }

    if (scope.mode === "org") {
      const owned = await db
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.organizationId, scope.organizationId));
      const ownedIds = new Set(owned.map((c) => c.id));
      if (!orderedIds.every((id) => ownedIds.has(id))) {
        throw new Error("No puedes reordenar categorías de otra entidad");
      }
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
        entityId: scope.mode === "org" ? scope.organizationId : "platform",
        details: `Reordenadas ${orderedIds.length} categorías`,
    });

    revalidatePath("/admin/categories");
    return { success: true };
}
