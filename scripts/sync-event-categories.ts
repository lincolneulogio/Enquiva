import { db } from "@/lib/db";
import { categories, events } from "@/lib/db/schema";
import { eq, inArray, notInArray } from "drizzle-orm";

const CATEGORY_ALIASES: Record<string, string> = {
    conferencia: "conference",
    convencion: "convention",
    convención: "convention",
    radio: "broadcast",
    programa_radial: "broadcast",
    tv: "streaming",
    online: "streaming",
    comunidad: "community",
    familia: "family_faith",
    noticias: "news_analysis",
    musica: "music_testimony",
};

const DESIRED_BY_EVENT_SLUG: Record<string, string> = {
    "convencion-peru-2026-arequipa": "convention",
    "convencion-peru-2026-lima": "convention",
    "convencion-peru-2026-huanuco": "convention",
    "congreso-centroamericano-caribe-panama-2026": "conference",
    "inauguracion-oficinas-internacionales-mmm-puerto-rico": "community",
    "bethel-radio-despierta-con-bethel-semanal": "family_faith",
    "bethel-radio-hora-punta-en-vivo": "news_analysis",
    "bethel-radio-entre-notas-comunidad": "music_testimony",
    "bethel-tv-transmision-especial-en-vivo": "streaming",
};

function normalizeCategory(raw: string) {
    const normalized = raw
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");

    return CATEGORY_ALIASES[normalized] ?? normalized;
}

async function main() {
    const allCategories = await db.select({ slug: categories.slug }).from(categories);
    const validCategorySlugs = new Set(allCategories.map((c) => c.slug));

    const allEvents = await db
        .select({ id: events.id, slug: events.slug, category: events.category })
        .from(events);

    let updated = 0;

    for (const event of allEvents) {
        const desiredBySlug = DESIRED_BY_EVENT_SLUG[event.slug ?? ""];
        let nextCategory = desiredBySlug ?? normalizeCategory(event.category);

        if (!validCategorySlugs.has(nextCategory)) {
            nextCategory = "community";
        }

        if (event.category !== nextCategory) {
            await db
                .update(events)
                .set({ category: nextCategory, updatedAt: new Date() })
                .where(eq(events.id, event.id));

            updated += 1;
            console.log(`↻ Event category updated: ${event.slug} (${event.category} -> ${nextCategory})`);
        }
    }

    const refreshedEvents = await db.select({ category: events.category }).from(events);
    const usedCategorySlugs = Array.from(new Set(refreshedEvents.map((e) => e.category)));

    if (usedCategorySlugs.length > 0) {
        await db
            .update(categories)
            .set({ isActive: true, updatedAt: new Date() })
            .where(inArray(categories.slug, usedCategorySlugs));

        await db
            .update(categories)
            .set({ isActive: false, updatedAt: new Date() })
            .where(notInArray(categories.slug, usedCategorySlugs));
    }

    const unused = await db
        .select({ slug: categories.slug })
        .from(categories)
        .where(eq(categories.isActive, false));

    console.log();
    console.log(`Done. Updated ${updated} event(s).`);
    if (unused.length) {
        console.log(`Inactive categories (${unused.length}): ${unused.map((c) => c.slug).join(", ")}`);
    } else {
        console.log("All categories are currently used by at least one event.");
    }
}

main().catch((error) => {
    console.error("Sync event categories failed:", error);
    process.exit(1);
});