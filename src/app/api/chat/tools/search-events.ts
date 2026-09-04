import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { and, eq, ilike, or, desc, type SQL } from "drizzle-orm";
import { z } from "zod";
import { scopeEventsForChat, type ChatToolScope } from "./scope";
import { formatDateTimeInTimezone } from "@/lib/settings/platform-locale";

const LATEST_KEYWORDS = ["ultimo", "último", "reciente", "recientes", "últimos", "ultimos", "creado"];

export function createSearchEvents(scope: ChatToolScope) {
  const staffScope =
    scope.role === "member" ? undefined : scopeEventsForChat(scope);

  return {
    description:
      scope.role === "member"
        ? "Busca eventos publicados en la plataforma por título, descripción o categoría."
        : scope.role === "super_admin"
          ? "Busca eventos publicados en la plataforma."
          : scope.role === "admin" || scope.role === "scanner"
            ? "Busca eventos publicados de tu entidad."
            : "Busca tus eventos publicados.",
    parameters: z.object({
      query: z.string().describe("Texto de búsqueda (ej. 'conferencia', 'taller', 'jóvenes')"),
    }),
    execute: async ({ query }: { query: string }) => {
      try {
        const safeQuery = query ?? "";
        const lower = safeQuery.toLowerCase().trim();
        const isLatest = LATEST_KEYWORDS.some((k) => lower.includes(k));
        const isGeneral =
          !safeQuery || isLatest || ["all", "todos", "any", "proximos", "próximos"].includes(lower);

        const publishedCondition = eq(events.status, "published");
        const baseConditions = (): SQL[] => {
          const conditions: SQL[] = [publishedCondition];
          if (staffScope) conditions.push(staffScope);
          return conditions;
        };

        let rows = [];

        if (isGeneral) {
          rows = await db
            .select()
            .from(events)
            .where(and(...baseConditions()))
            .orderBy(isLatest ? desc(events.createdAt) : desc(events.date))
            .limit(5);
        } else {
          rows = await db
            .select()
            .from(events)
            .where(
              and(
                ...baseConditions(),
                or(
                  ilike(events.title, `%${safeQuery}%`),
                  ilike(events.description, `%${safeQuery}%`),
                  ilike(events.category, `%${safeQuery}%`),
                ),
              ),
            )
            .orderBy(desc(events.date))
            .limit(5);

          if (rows.length === 0) {
            const stopWords = new Set([
              "de", "del", "el", "la", "los", "las", "un", "una", "unos", "unas", "para", "en", "con", "y", "a", "o",
              "que", "al", "por", "sobre", "hay", "algun", "algún", "evento", "eventos", "buscar", "quiero",
              "encontrar", "dame", "información", "sobre", "este",
            ]);
            const words = lower
              .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?¿¡]/g, "")
              .split(/\s+/)
              .filter((w) => w.length > 2 && !stopWords.has(w));

            if (words.length > 0) {
              const orConditions: SQL[] = [];
              for (const word of words) {
                orConditions.push(ilike(events.title, `%${word}%`));
                orConditions.push(ilike(events.description, `%${word}%`));
                orConditions.push(ilike(events.category, `%${word}%`));
              }

              rows = await db
                .select()
                .from(events)
                .where(and(...baseConditions(), or(...orConditions)))
                .orderBy(desc(events.date))
                .limit(5);
            }
          }
        }

        let message = "";
        let isFallback = false;
        if (rows.length === 0) {
          isFallback = true;
          rows = await db
            .select()
            .from(events)
            .where(and(...baseConditions()))
            .orderBy(desc(events.date))
            .limit(3);
          message = `No encontré eventos relacionados con "${safeQuery}". Estos son los más recientes en tu alcance:`;
        }

        if (rows.length === 0) {
          return { message: "No hay eventos publicados en tu alcance." };
        }

        const results = rows.map((e) => ({
          id: e.id,
          title: e.title,
          description: e.description ? e.description.substring(0, 120) + "..." : "Sin descripción",
          category: e.category,
          date: formatDateTimeInTimezone(e.date, {
            timeZone: scope.timeZone,
            locale: scope.locale,
            dateStyle: "medium",
            timeStyle: "short",
          }),
          location: e.isVirtual ? "Virtual" : (e.location ?? "Por confirmar"),
          price: e.price ? `S/ ${Number(e.price).toFixed(2)}` : "Gratuito",
          capacity: e.capacity ?? "Ilimitada",
        }));

        return isFallback ? { message, events: results, timeZone: scope.timeZone } : { events: results, timeZone: scope.timeZone };
      } catch (err) {
        console.error("Error in searchEvents:", err);
        return { error: "No se pudo realizar la búsqueda de eventos." };
      }
    },
  };
}
