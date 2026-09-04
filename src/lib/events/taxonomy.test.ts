import { describe, expect, it } from "vitest";
import {
  EVENT_CATEGORIES,
  canonicalCategorySlug,
  getCategoryDefinition,
  getTypesForCategory,
  LEGACY_CATEGORY_MAP,
  MODALITY_OPTIONS,
  DATE_FILTER_OPTIONS,
  PRICE_FILTER_OPTIONS,
} from "./taxonomy";
import { eventFilterSchema, baseEventSchema } from "@/lib/validations/event";
import { CATEGORY_LUCIDE_ICONS, getCategoryLucideIcon } from "@/components/events/CategoryIcon";

describe("Event Taxonomy & Categories", () => {
  it("defines exactly 18 core categories with all required fields", () => {
    expect(EVENT_CATEGORIES.length).toBe(18);

    for (const cat of EVENT_CATEGORIES) {
      expect(cat.slug).toBeTruthy();
      expect(cat.labelEs).toBeTruthy();
      expect(cat.labelEn).toBeTruthy();
      expect(cat.iconName).toBeTruthy();
      expect(cat.colorClass).toBeTruthy();
      expect(cat.types.length).toBeGreaterThan(0);
      for (const t of cat.types) {
        expect(t.slug).toBeTruthy();
        expect(t.label).toBeTruthy();
      }
    }
  });

  it("canonicalCategorySlug correctly maps legacy slugs to canonical ones", () => {
    expect(canonicalCategorySlug("worship")).toBe("religion");
    expect(canonicalCategorySlug("retreat")).toBe("religion");
    expect(canonicalCategorySlug("youth")).toBe("family");
    expect(canonicalCategorySlug("bible_study")).toBe("education");
    expect(canonicalCategorySlug("prayer")).toBe("religion");
    expect(canonicalCategorySlug("outreach")).toBe("community");
    expect(canonicalCategorySlug("fellowship")).toBe("community");
    expect(canonicalCategorySlug("conference")).toBe("conferences");
  });

  it("canonicalCategorySlug keeps standard slugs intact", () => {
    expect(canonicalCategorySlug("conferences")).toBe("conferences");
    expect(canonicalCategorySlug("technology")).toBe("technology");
    expect(canonicalCategorySlug("music")).toBe("music");
    expect(canonicalCategorySlug("sports")).toBe("sports");
    expect(canonicalCategorySlug("custom_org_category")).toBe("custom_org_category");
  });

  it("getCategoryDefinition finds canonical definition by slug or legacy slug", () => {
    const musicDef = getCategoryDefinition("music");
    expect(musicDef).toBeDefined();
    expect(musicDef?.slug).toBe("music");
    expect(musicDef?.labelEs).toBe("Música y entretenimiento");

    const mappedLegacy = getCategoryDefinition("worship");
    expect(mappedLegacy).toBeDefined();
    expect(mappedLegacy?.slug).toBe("religion");
  });

  it("getTypesForCategory retrieves types for given category", () => {
    const techTypes = getTypesForCategory("technology");
    const techSlugs = techTypes.map((t) => t.slug);
    const techLabels = techTypes.map((t) => t.label);

    expect(techSlugs).toContain("hackathon");
    expect(techLabels).toContain("Hackathon");
    expect(techLabels).toContain("Demo day");

    const musicTypes = getTypesForCategory("music");
    const musicLabels = musicTypes.map((t) => t.label);
    expect(musicLabels).toContain("Concierto");
    expect(musicLabels).toContain("Festival");
  });

  it("provides comprehensive filter options", () => {
    expect(MODALITY_OPTIONS.map((m) => m.value)).toEqual(["all", "in_person", "online", "hybrid"]);
    expect(DATE_FILTER_OPTIONS.map((d) => d.value)).toContain("today");
    expect(DATE_FILTER_OPTIONS.map((d) => d.value)).toContain("this_week");
    expect(PRICE_FILTER_OPTIONS.map((p) => p.value)).toEqual(["all", "free", "paid"]);
  });

  it("maps every canonical category to an installed Lucide icon component", () => {
    for (const cat of EVENT_CATEGORIES) {
      const icon = CATEGORY_LUCIDE_ICONS[cat.slug];
      expect(icon).toBeDefined();
      expect(typeof icon).toBe("object"); // forwardRef in React is an object or function
      const retrieved = getCategoryLucideIcon(cat.slug);
      expect(retrieved).toBeDefined();
    }
  });
});

describe("Event Validation Schemas", () => {
  it("validates eventFilterSchema with valid search query params", () => {
    const result = eventFilterSchema.safeParse({
      category: "technology",
      type: "Hackathon",
      modality: "online",
      price: "free",
      date: "this_month",
      page: "2",
      limit: "12",
      search: "AI summit",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.category).toBe("technology");
      expect(result.data.type).toBe("Hackathon");
      expect(result.data.modality).toBe("online");
      expect(result.data.price).toBe("free");
      expect(result.data.page).toBe(2);
      expect(result.data.limit).toBe(12);
      expect(result.data.search).toBe("AI summit");
    }
  });

  it("accepts canonical and legacy categories in baseEventSchema", () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10);
    const isoFuture = futureDate.toISOString();

    const validCanonical = baseEventSchema.safeParse({
      title: "Global Tech Summit 2026",
      description: "A large summit for software developers and tech enthusiasts.",
      category: "technology",
      date: isoFuture,
    });
    expect(validCanonical.success).toBe(true);

    const validLegacy = baseEventSchema.safeParse({
      title: "Community Outreach 2026",
      description: "Bringing help and resources to the local neighborhood.",
      category: "outreach",
      date: isoFuture,
    });
    expect(validLegacy.success).toBe(true);
  });
});
