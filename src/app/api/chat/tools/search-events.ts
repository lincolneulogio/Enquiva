import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { and, eq, ilike, or, desc } from "drizzle-orm";
import { z } from "zod";

const LATEST_KEYWORDS = ["ultimo", "último", "reciente", "recientes", "últimos", "ultimos", "creado"];

export const searchEvents = {
  description: "Busca eventos activos en la plataforma filtrando por título, descripción o categoría.",
  parameters: z.object({
    query: z.string().describe("El texto de búsqueda (ej. 'retiro', 'oración', 'jóvenes')"),
  }),
  execute: async ({ query }: { query: string }) => {
    try {
      const safeQuery = query ?? "";
      const lower = safeQuery.toLowerCase().trim();
      const isLatest = LATEST_KEYWORDS.some((k) => lower.includes(k));
      const isGeneral = !safeQuery || isLatest || ["all", "todos", "any", "proximos", "próximos"].includes(lower);

      let rows = [];

      if (isGeneral) {
        rows = await db.select().from(events)
          .where(eq(events.status, "published"))
          .orderBy(isLatest ? desc(events.createdAt) : desc(events.date))
          .limit(5);
      } else {
        // 1. Intento de búsqueda exacta de la frase
        rows = await db.select().from(events)
          .where(
            and(
              eq(events.status, "published"),
              or(
                ilike(events.title, `%${safeQuery}%`),
                ilike(events.description, `%${safeQuery}%`),
                ilike(events.category, `%${safeQuery}%`),
              )
            )
          )
          .orderBy(desc(events.date))
          .limit(5);

        // 2. Si no hay resultados exactos, intentamos búsqueda flexible por palabras clave significativas (Tokenización)
        if (rows.length === 0) {
          const stopWords = new Set([
            "de", "del", "el", "la", "los", "las", "un", "una", "unos", "unas", "para", "en", "con", "y", "a", "o", "que", "al", "por", 
            "sobre", "hay", "algun", "algún", "evento", "eventos", "buscar", "quiero", "encontrar", "dame", "información", "sobre", "este"
          ]);
          // Reemplazar signos de puntuación y dividir en palabras
          const words = lower
            .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?¿¡]/g, "")
            .split(/\s+/)
            .filter((w) => w.length > 2 && !stopWords.has(w));

          if (words.length > 0) {
            const orConditions = [];
            for (const word of words) {
              orConditions.push(ilike(events.title, `%${word}%`));
              orConditions.push(ilike(events.description, `%${word}%`));
              orConditions.push(ilike(events.category, `%${word}%`));
            }

            rows = await db.select().from(events)
              .where(
                and(
                  eq(events.status, "published"),
                  or(...orConditions)
                )
              )
              .orderBy(desc(events.date))
              .limit(5);
          }
        }
      }

      // 3. Recomendación Proactiva (Fallback): si la lista sigue vacía, traemos los próximos 3 eventos
      let message = "";
      let isFallback = false;
      if (rows.length === 0) {
        isFallback = true;
        rows = await db.select().from(events)
          .where(eq(events.status, "published"))
          .orderBy(desc(events.date))
          .limit(3);
        message = `No encontré eventos específicos relacionados con tu búsqueda ("${safeQuery}"), pero te sugiero echar un vistazo a los próximos eventos programados en la plataforma:`;
      }

      if (rows.length === 0) {
        return { message: "Actualmente no hay eventos programados en la plataforma." };
      }

      const results = rows.map((e) => ({
        id: e.id,
        title: e.title,
        description: e.description ? e.description.substring(0, 120) + "..." : "Sin descripción",
        category: e.category,
        date: new Date(e.date).toLocaleString("es-PE"),
        location: e.isVirtual ? "Virtual (Enlace disponible al inscribirse)" : (e.location ?? "Por confirmar"),
        price: e.price ? `S/ ${Number(e.price).toFixed(2)}` : "Gratuito",
        capacity: e.capacity ?? "Ilimitada",
      }));

      return isFallback ? { message, events: results } : results;
    } catch (err) {
      console.error("Error in searchEvents:", err);
      return { error: "No se pudo realizar la búsqueda de eventos." };
    }
  },
};
