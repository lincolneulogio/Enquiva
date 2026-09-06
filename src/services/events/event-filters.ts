import { events } from "@/lib/db/schema";
import {
  eq,
  and,
  ilike,
  sql,
  inArray,
  isNull,
  gte,
  or,
  gt,
  lte,
  lt,
  type SQL,
} from "drizzle-orm";
import { canonicalCategorySlug, LEGACY_CATEGORY_MAP } from "@/lib/events/taxonomy";
import type { EventFilterInput } from "@/lib/validations";

export function buildPublicEventConditions(filter: EventFilterInput): SQL[] {
  const conditions: SQL[] = [eq(events.status, "published")];

  // 1. Categoría (con compatibilidad de slugs legados)
  if (filter.category && filter.category !== "all") {
    const canonical = canonicalCategorySlug(filter.category);
    const matchingSlugs = [canonical];
    for (const [legacySlug, canonicalSlug] of Object.entries(LEGACY_CATEGORY_MAP)) {
      if (canonicalSlug === canonical && !matchingSlugs.includes(legacySlug)) {
        matchingSlugs.push(legacySlug);
      }
    }
    if (!matchingSlugs.includes(filter.category)) {
      matchingSlugs.push(filter.category);
    }
    conditions.push(inArray(events.category, matchingSlugs));
  }

  // 2. Tipo específico de evento (subcategoría)
  if (filter.type && filter.type.trim() && filter.type !== "all") {
    const typeClean = filter.type.trim();
    conditions.push(
      or(
        ilike(events.title, `%${typeClean}%`),
        ilike(events.description, `%${typeClean}%`)
      )!
    );
  }

  // 3. Modalidad (Presencial / Online / Híbrido)
  if (filter.modality && filter.modality !== "all") {
    if (filter.modality === "online") {
      conditions.push(eq(events.isVirtual, true));
    } else if (filter.modality === "in_person") {
      conditions.push(eq(events.isVirtual, false));
    } else if (filter.modality === "hybrid") {
      conditions.push(
        or(
          and(sql`${events.virtualLink} IS NOT NULL`, sql`${events.location} IS NOT NULL`),
          ilike(events.description, "%hibrid%"),
          ilike(events.description, "%híbrid%")
        )!
      );
    }
  }

  // 4. Rango de fecha
  if (filter.date && filter.date !== "all") {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    if (filter.date === "today") {
      conditions.push(and(gte(events.date, startOfToday), lte(events.date, endOfToday))!);
    } else if (filter.date === "tomorrow") {
      const startOfTomorrow = new Date(startOfToday.getTime() + 86_400_000);
      const endOfTomorrow = new Date(endOfToday.getTime() + 86_400_000);
      conditions.push(and(gte(events.date, startOfTomorrow), lte(events.date, endOfTomorrow))!);
    } else if (filter.date === "this_week") {
      const dayOfWeek = now.getDay();
      const distanceToMonday = (dayOfWeek + 6) % 7;
      const startOfWeek = new Date(startOfToday.getTime() - distanceToMonday * 86_400_000);
      const endOfWeek = new Date(startOfWeek.getTime() + 7 * 86_400_000 - 1);
      conditions.push(and(gte(events.date, startOfWeek), lte(events.date, endOfWeek))!);
    } else if (filter.date === "this_month") {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      conditions.push(and(gte(events.date, startOfMonth), lte(events.date, endOfMonth))!);
    } else if (filter.date === "upcoming") {
      conditions.push(gte(events.date, now));
    } else if (filter.date === "past") {
      conditions.push(lt(events.date, now));
    }
  }

  // 5. Precio
  if (filter.price && filter.price !== "all") {
    if (filter.price === "free") {
      conditions.push(or(isNull(events.price), eq(events.price, "0"), eq(events.price, "0.00"))!);
    } else if (filter.price === "paid") {
      conditions.push(and(sql`${events.price} IS NOT NULL`, sql`CAST(${events.price} AS NUMERIC) > 0`)!);
    }
  }

  // 6. Tipo de acceso
  if (filter.accessType && filter.accessType !== "all") {
    if (filter.accessType === "free") {
      conditions.push(or(isNull(events.price), eq(events.price, "0"), eq(events.price, "0.00"))!);
    } else if (filter.accessType === "paid") {
      conditions.push(and(sql`${events.price} IS NOT NULL`, sql`CAST(${events.price} AS NUMERIC) > 0`)!);
    } else if (filter.accessType === "invitation") {
      conditions.push(or(ilike(events.description, "%invitaci%"), ilike(events.title, "%invitaci%"))!);
    }
  }

  // 7. Estado del evento
  if (filter.eventStatus && filter.eventStatus !== "all") {
    const now = new Date();
    if (filter.eventStatus === "upcoming") {
      conditions.push(gt(events.date, now));
    } else if (filter.eventStatus === "ongoing") {
      conditions.push(
        and(
          lte(events.date, now),
          or(isNull(events.endDate), gte(events.endDate, now))
        )!
      );
    } else if (filter.eventStatus === "completed") {
      conditions.push(
        or(
          and(sql`${events.endDate} IS NOT NULL`, lt(events.endDate, now)),
          and(isNull(events.endDate), lt(events.date, now))
        )!
      );
    }
  }

  // 8. Ubicación
  if (filter.location && filter.location.trim()) {
    conditions.push(ilike(events.location, `%${filter.location.trim()}%`));
  }

  // 9. Búsqueda por texto libre
  if (filter.search && filter.search.trim()) {
    const term = `%${filter.search.trim()}%`;
    conditions.push(
      or(
        ilike(events.title, term),
        ilike(events.description, term),
        ilike(events.location, term)
      )!
    );
  }

  return conditions;
}
