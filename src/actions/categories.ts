"use server";

import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { eq, and, sql as sqlExpr, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireApprovedEventManager } from "@/lib/auth/guards";
import { normalizeRole } from "@/lib/auth/rbac";
import {
  getOrganizationIdForUser,
  resolveAdminScopeForUser,
} from "@/lib/organizations/admin-scope";
import { normalizeCategorySlug } from "@/lib/utils";

/**
 * Alta rápida de categoría desde el formulario de evento.
 * Organizador/admin: siempre ligada a su entidad. Superadmin: plataforma.
 */
export async function createOrgCategoryQuick(input: {
  label: string;
  description?: string;
}) {
  const user = await requireApprovedEventManager();
  const role = normalizeRole(user.role);
  const label = input.label.trim();
  if (!label) throw new Error("El nombre de la categoría es obligatorio");

  const slug = normalizeCategorySlug(label);
  if (!slug || !/^[a-z0-9_]+$/.test(slug)) {
    throw new Error("No se pudo generar un slug válido a partir del nombre");
  }

  let organizationId: string | null = null;
  if (role === "organizer") {
    organizationId = await getOrganizationIdForUser(user.id);
    if (!organizationId) {
      throw new Error("Debes pertenecer a una entidad para crear categorías");
    }
  } else if (role === "admin") {
    const scope = await resolveAdminScopeForUser(user.id, user.role);
    if (scope.mode !== "org") {
      throw new Error("Debes pertenecer a una entidad para crear categorías");
    }
    organizationId = scope.organizationId;
  }
  // super_admin → organizationId null (plataforma)

  const [existing] = await db
    .select({
      slug: categories.slug,
      label: categories.label,
      colorClass: categories.colorClass,
      isActive: categories.isActive,
    })
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
  if (existing) {
    if (!existing.isActive) {
      await db
        .update(categories)
        .set({ isActive: true, updatedAt: new Date() })
        .where(
          and(
            eq(categories.slug, slug),
            organizationId
              ? eq(categories.organizationId, organizationId)
              : sqlExpr`${categories.organizationId} IS NULL`,
          ),
        );
    }

    revalidatePath("/organizer/events/new");
    revalidatePath("/admin/categories");
    revalidatePath("/superadmin/categories");
    return {
      success: true as const,
      created: false as const,
      category: {
        slug: existing.slug,
        label: existing.label,
        colorClass: existing.colorClass,
      },
    };
  }

  const [maxRow] = await db
    .select({ sortOrder: categories.sortOrder })
    .from(categories)
    .where(
      organizationId
        ? eq(categories.organizationId, organizationId)
        : sqlExpr`${categories.organizationId} IS NULL`,
    )
    .orderBy(desc(categories.sortOrder))
    .limit(1);

  const [created] = await db
    .insert(categories)
    .values({
      slug,
      label,
      description: input.description?.trim() || null,
      colorClass: "bg-gray-100 text-gray-800",
      sortOrder: (maxRow?.sortOrder ?? 0) + 1,
      createdBy: user.id,
      organizationId,
      isActive: true,
    })
    .returning({
      slug: categories.slug,
      label: categories.label,
      colorClass: categories.colorClass,
    });

  revalidatePath("/organizer/events/new");
  revalidatePath("/admin/categories");
  revalidatePath("/superadmin/categories");
  return { success: true as const, created: true as const, category: created };
}
