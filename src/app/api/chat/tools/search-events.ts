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
      const isGeneral = !safeQuery || isLatest || ["all", "todos", "any"].includes(lower);

      const filter = isGeneral
        ? eq(events.status, "published")
        : and(eq(events.status, "published"), or(
            ilike(events.title, `%${safeQuery}%`),
            ilike(events.description, `%${safeQuery}%`),
            ilike(events.category, `%${safeQuery}%`),
          ));

      const rows = await db.select().from(events).where(filter)
        .orderBy(isLatest ? desc(events.createdAt) : desc(events.date)).limit(5);

      if (rows.length === 0) return { message: "No se encontraron eventos activos coincidentes." };

      return rows.map((e) => ({
        id: e.id, title: e.title,
        description: e.description ? e.description.substring(0, 100) + "..." : "Sin descripción",
        category: e.category, date: new Date(e.date).toLocaleString("es-PE"),
        location: e.isVirtual ? "Virtual (Enlace disponible al inscribirse)" : (e.location ?? "Por confirmar"),
        price: e.price ? `S/ ${Number(e.price).toFixed(2)}` : "Gratuito",
        capacity: e.capacity ?? "Ilimitada",
      }));
    } catch (err) {
      console.error("Error in searchEvents:", err);
      return { error: "No se pudo realizar la búsqueda de eventos." };
    }
  },
};
