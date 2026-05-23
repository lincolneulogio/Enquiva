import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import type { Category } from "@/lib/db/schema";
import { eq, asc, sql as sqlExpr } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAdminOrSuper } from "./helpers";

export async function getAllCategories(): Promise<Category[]> {
    await requireAdminOrSuper();
    return db.select().from(categories).orderBy(asc(categories.sortOrder));
}

export async function createCategory(input: {
    slug: string;
    label: string;
    description?: string;
    colorClass?: string;
    sortOrder?: number;
}) {
    const user = await requireAdminOrSuper();
    const slug = input.slug.trim().toLowerCase().replace(/\s+/g, "_");
    if (!/^[a-z0-9_]+$/.test(slug)) throw new Error("Slug can only contain lowercase letters, numbers and underscores");
    const [created] = await db.insert(categories).values({
        slug,
        label: input.label.trim(),
        description: input.description?.trim() ?? null,
        colorClass: input.colorClass ?? "bg-gray-100 text-gray-800",
        sortOrder: input.sortOrder ?? 99,
        createdBy: user.id,
    }).returning();
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
    await requireAdminOrSuper();
    await db.update(categories).set({
        ...(input.label !== undefined && { label: input.label.trim() }),
        ...(input.description !== undefined && { description: input.description.trim() }),
        ...(input.colorClass !== undefined && { colorClass: input.colorClass }),
        ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
        updatedAt: new Date(),
    }).where(eq(categories.id, id));
    revalidatePath("/admin/categories");
    return { success: true };
}

export async function deleteCategory(id: string) {
    await requireAdminOrSuper();
    const [cat] = await db.select({ slug: categories.slug }).from(categories).where(eq(categories.id, id));
    if (!cat) throw new Error("Category not found");
    const { events: eventsTable } = await import("@/lib/db/schema");
    const [{ cnt }] = await db
        .select({ cnt: sqlExpr<number>`count(*)::int` })
        .from(eventsTable)
        .where(eq(eventsTable.category, cat.slug));
    if (cnt > 0) throw new Error(`Cannot delete — ${cnt} event(s) use this category`);
    await db.delete(categories).where(eq(categories.id, id));
    revalidatePath("/admin/categories");
    return { success: true };
}

export async function reorderCategories(orderedIds: string[]) {
    await requireAdminOrSuper();

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

    revalidatePath("/admin/categories");
    return { success: true };
}
