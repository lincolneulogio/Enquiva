"use server";

import { db } from "@/lib/db";
import { pageSections, type PageSection, type NewPageSection } from "@/lib/db/schema";
import { eq, asc, desc, and } from "drizzle-orm";
import { requireSuperAdmin } from "@/lib/auth/guards";
import { revalidatePath } from "next/cache";
import { invalidateCache, setCached, getCached } from "@/lib/redis";
import { z } from "zod";

const CACHE_TTL = 120;

function cacheKeyFor(pageKey: string): string {
  return `page:sections:${pageKey}`;
}

const PAGE_REVALIDATE_PATHS: Record<string, string[]> = {
  about: ["/about", "/superadmin/about"],
  terms: ["/terms", "/superadmin/terms"],
};

function revalidatePageSections(pageKey: string) {
  invalidateCache(cacheKeyFor(pageKey)).catch(() => {});
  const paths = PAGE_REVALIDATE_PATHS[pageKey] ?? [`/${pageKey}`, `/superadmin/${pageKey}`];
  for (const path of paths) revalidatePath(path);
}

const sectionSchema = z.object({
  kind: z.string().min(1).default("section"),
  titleEs: z.string().trim().max(200).nullable().default(null),
  titleEn: z.string().trim().max(200).nullable().default(null),
  subtitleEs: z.string().trim().max(400).nullable().default(null),
  subtitleEn: z.string().trim().max(400).nullable().default(null),
  bodyEs: z.string().trim().max(50000).nullable().default(null),
  bodyEn: z.string().trim().max(50000).nullable().default(null),
  imageUrl: z.string().url("URL de imagen no válida").nullable().default(null).or(z.literal("").transform(() => null)),
  firstName: z.string().trim().max(120).nullable().default(null),
  lastName: z.string().trim().max(120).nullable().default(null),
  role: z.string().trim().max(200).nullable().default(null),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
});

type SectionInput = z.infer<typeof sectionSchema>;

export async function getAdminPageSectionsAction(pageKey = "about"): Promise<PageSection[]> {
  await requireSuperAdmin();
  return db
    .select()
    .from(pageSections)
    .where(eq(pageSections.pageKey, pageKey))
    .orderBy(asc(pageSections.sortOrder), desc(pageSections.createdAt));
}

export async function getPublicPageSectionsAction(pageKey = "about"): Promise<PageSection[]> {
  const cacheKey = cacheKeyFor(pageKey);
  const cached = await getCached<PageSection[]>(cacheKey);
  if (cached) return cached;

  try {
    const sections = await db
      .select()
      .from(pageSections)
      .where(and(eq(pageSections.pageKey, pageKey), eq(pageSections.isActive, true)))
      .orderBy(asc(pageSections.sortOrder));

    if (sections.length > 0) {
      await setCached(cacheKey, sections, CACHE_TTL);
    }
    return sections;
  } catch (error) {
    console.error("[pages] Error fetching public page sections:", error);
    return [];
  }
}

export async function createPageSectionAction(data: SectionInput, pageKey = "about") {
  await requireSuperAdmin();

  const parsed = sectionSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const values: NewPageSection = {
    pageKey,
    kind: parsed.data.kind,
    titleEs: parsed.data.titleEs,
    titleEn: parsed.data.titleEn,
    subtitleEs: parsed.data.subtitleEs,
    subtitleEn: parsed.data.subtitleEn,
    bodyEs: parsed.data.bodyEs,
    bodyEn: parsed.data.bodyEn,
    firstName: parsed.data.firstName,
    lastName: parsed.data.lastName,
    role: parsed.data.role,
    imageUrl: parsed.data.imageUrl,
    sortOrder: parsed.data.sortOrder,
    isActive: parsed.data.isActive,
  };

  const [created] = await db.insert(pageSections).values(values).returning();

  revalidatePageSections(pageKey);

  return { success: true, section: created };
}

export async function updatePageSectionAction(id: string, data: Partial<SectionInput>, pageKey = "about") {
  await requireSuperAdmin();

  const updateValues: Partial<NewPageSection> = { updatedAt: new Date() };

  if (data.kind !== undefined) updateValues.kind = data.kind;
  if (data.titleEs !== undefined) updateValues.titleEs = data.titleEs;
  if (data.titleEn !== undefined) updateValues.titleEn = data.titleEn;
  if (data.subtitleEs !== undefined) updateValues.subtitleEs = data.subtitleEs;
  if (data.subtitleEn !== undefined) updateValues.subtitleEn = data.subtitleEn;
  if (data.bodyEs !== undefined) updateValues.bodyEs = data.bodyEs;
  if (data.bodyEn !== undefined) updateValues.bodyEn = data.bodyEn;
  if (data.firstName !== undefined) updateValues.firstName = data.firstName;
  if (data.lastName !== undefined) updateValues.lastName = data.lastName;
  if (data.role !== undefined) updateValues.role = data.role;
  if (data.imageUrl !== undefined) updateValues.imageUrl = data.imageUrl;
  if (data.sortOrder !== undefined) updateValues.sortOrder = data.sortOrder;
  if (data.isActive !== undefined) updateValues.isActive = data.isActive;

  const [updated] = await db
    .update(pageSections)
    .set(updateValues)
    .where(eq(pageSections.id, id))
    .returning();

  revalidatePageSections(pageKey);

  return { success: true, section: updated };
}

export async function togglePageSectionActiveAction(id: string, isActive: boolean, pageKey = "about") {
  await requireSuperAdmin();

  await db
    .update(pageSections)
    .set({ isActive, updatedAt: new Date() })
    .where(eq(pageSections.id, id));

  revalidatePageSections(pageKey);

  return { success: true, isActive };
}

export async function deletePageSectionAction(id: string, pageKey = "about") {
  await requireSuperAdmin();

  await db.delete(pageSections).where(eq(pageSections.id, id));

  revalidatePageSections(pageKey);

  return { success: true };
}

export async function reorderPageSectionsAction(orderedIds: string[], pageKey = "about") {
  await requireSuperAdmin();

  await Promise.all(
    orderedIds.map((id, index) =>
      db
        .update(pageSections)
        .set({ sortOrder: index, updatedAt: new Date() })
        .where(eq(pageSections.id, id)),
    ),
  );

  revalidatePageSections(pageKey);

  return { success: true };
}
