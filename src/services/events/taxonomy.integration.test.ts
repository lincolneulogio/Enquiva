import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { categories, events, eventTypes, users, categorySlugAliases, eventTypeSlugAliases } from "@/lib/db/schema";
import { isUUID, resolveCategoryCurrentSlug, resolveEventTypeIds } from "@/lib/events/slug-resolution";
import { EventCatalogService } from "@/services/events/event-catalog.service";

const runIntegration = process.env.RUN_SERVICE_INTEGRATION === "1";

describe.skipIf(!runIntegration)("Taxonomía de eventos (integración)", () => {
  const uid = randomUUID().slice(0, 8);
  const categorySlug = `vitest_tax_${uid}_cat`;
  const typeSlug = `vitest_tax_${uid}_type`;
  const oldCategorySlug = `vitest_tax_${uid}_oldcat`;
  const oldTypeSlug = `vitest_tax_${uid}_oldtype`;

  let categoryId = "";
  let typeId = "";
  let eventId = "";

  beforeAll(async () => {
    // Crea infraestructura única de taxonomía y un evento publicado vinculado.
    const [category] = await db
      .insert(categories)
      .values({
        organizationId: null,
        slug: categorySlug,
        label: `Vitest Tax Área ${uid}`,
        labelEn: `Vitest Tax Area ${uid}`,
        colorClass: "bg-gray-100 text-gray-800",
        isActive: true,
        sortOrder: 999,
      })
      .returning();
    categoryId = category.id;

    const [type] = await db
      .insert(eventTypes)
      .values({
        categorySlug,
        slug: typeSlug,
        label: `Vitest Type ${uid}`,
        labelEn: `Vitest English Type ${uid}`,
        isActive: true,
        sortOrder: 999,
      })
      .returning();
    typeId = type.id;

    // Simula renombres históricos: registra el slug anterior como alias.
    await db.insert(categorySlugAliases).values({ categoryId, slug: oldCategorySlug });
    await db.insert(eventTypeSlugAliases).values({ eventTypeId: typeId, categorySlug, slug: oldTypeSlug });

    const [organizer] = await db.select({ id: users.id }).from(users).limit(1);
    if (!organizer) throw new Error("No hay usuarios en la BD para crear evento de integración");

    const [event] = await db
      .insert(events)
      .values({
        organizerId: organizer.id,
        title: `Vitest Taxonomy Event ${uid}`,
        slug: `vitest-taxonomy-event-${uid}`,
        description: `Evento de integración para taxonomía ${uid}`,
        category: categorySlug,
        eventTypeId: typeId,
        date: new Date(Date.now() + 30 * 86_400_000),
        status: "published",
        isVirtual: false,
        isFeatured: false,
      })
      .returning();
    eventId = event.id;
  });

  afterAll(async () => {
    if (eventId) await db.delete(events).where(eq(events.id, eventId));
    if (typeId) await db.delete(eventTypes).where(eq(eventTypes.id, typeId));
    if (categoryId) await db.delete(categories).where(eq(categories.id, categoryId));
  });

  it("isUUID valida identificadores v4", () => {
    expect(isUUID(randomUUID())).toBe(true);
    expect(isUUID("no-es-uuid")).toBe(false);
    expect(isUUID("123e4567-e89b-12d3-a456-426614174000")).toBe(true);
  });

  it("resuelve slugs estáticos (canónico y legado) sin BD", async () => {
    await expect(resolveCategoryCurrentSlug("music")).resolves.toBe("music");
    await expect(resolveCategoryCurrentSlug("worship")).resolves.toBe("religion");
    await expect(resolveCategoryCurrentSlug("all")).resolves.toBeNull();
    await expect(resolveCategoryCurrentSlug(null)).resolves.toBeNull();
  });

  it("resuelve alias históricos de categoría al slug actual", async () => {
    await expect(resolveCategoryCurrentSlug(oldCategorySlug)).resolves.toBe(categorySlug);
    await expect(resolveCategoryCurrentSlug(categorySlug)).resolves.toBe(categorySlug);
  });

  it("resuelve tipos por UUID, slug actual y alias histórico", async () => {
    const byId = await resolveEventTypeIds(typeId, categorySlug);
    expect(byId).toEqual([typeId]);

    const bySlug = await resolveEventTypeIds(typeSlug, categorySlug);
    expect(bySlug).toEqual([typeId]);

    const byAlias = await resolveEventTypeIds(oldTypeSlug, categorySlug);
    expect(byAlias).toEqual([typeId]);
  });

  it("no resuelve tipos inexistentes o valores vacíos", async () => {
    await expect(resolveEventTypeIds("all")).resolves.toEqual([]);
    await expect(resolveEventTypeIds(null)).resolves.toEqual([]);
    await expect(resolveEventTypeIds(undefined)).resolves.toEqual([]);
    await expect(resolveEventTypeIds(randomUUID())).resolves.toEqual([]);
    await expect(resolveEventTypeIds("slug_que_no_existe", categorySlug)).resolves.toEqual([]);
  });

  it("los índices únicos rechazan slugs duplicados y alias duplicados", async () => {
    await expect(
      db.insert(categorySlugAliases).values({ categoryId, slug: oldCategorySlug }),
    ).rejects.toThrow();

    await expect(
      db.insert(eventTypes).values({
        categorySlug,
        slug: typeSlug,
        label: `Dup ${uid}`,
        isActive: true,
        sortOrder: 999,
      }),
    ).rejects.toThrow();
  });

  it("el catálogo público filtra por slug antiguo de categoría y tipo (alias)", async () => {
    const result = await EventCatalogService.getPublicEvents({
      category: oldCategorySlug,
      type: oldTypeSlug,
    });

    expect(result.total).toBeGreaterThanOrEqual(1);
    expect(result.events.some((e) => e.id === eventId)).toBe(true);

    const unrelated = await EventCatalogService.getPublicEvents({
      category: oldCategorySlug,
      type: "slug_que_no_resuelve_a_nada",
    });
    expect(unrelated.events.some((e) => e.id === eventId)).toBe(false);
  });

  it("borra en cascada alias al eliminar tipo y categoría", async () => {
    const catAliasBefore = await db
      .select()
      .from(categorySlugAliases)
      .where(eq(categorySlugAliases.slug, oldCategorySlug));
    expect(catAliasBefore.length).toBe(1);

    // Limpia el evento primero para no dejar fugas.
    await db.delete(events).where(eq(events.id, eventId));
    eventId = "";

    // Borrar el tipo elimina sus alias por cascada.
    await db.delete(eventTypes).where(eq(eventTypes.id, typeId));
    typeId = "";
    const typeAliasLeft = await db
      .select()
      .from(eventTypeSlugAliases)
      .where(eq(eventTypeSlugAliases.slug, oldTypeSlug));
    expect(typeAliasLeft).toEqual([]);

    // Borrar la categoría elimina sus alias por cascada.
    await db.delete(categories).where(eq(categories.id, categoryId));
    categoryId = "";
    const catAliasLeft = await db
      .select()
      .from(categorySlugAliases)
      .where(eq(categorySlugAliases.slug, oldCategorySlug));
    expect(catAliasLeft).toEqual([]);
  });
});