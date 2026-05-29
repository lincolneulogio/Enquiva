import { db } from "@/lib/db";
import { transportRoutes } from "@/lib/db/schema";
import { and, eq, desc } from "drizzle-orm";
import { z } from "zod";

export const getEventRoutes = {
  description: "Obtiene las rutas de transporte y buses asociadas a un evento específico.",
  parameters: z.object({
    eventId: z.string().uuid().describe("El ID único del evento para buscar sus rutas de transporte."),
  }),
  execute: async ({ eventId }: { eventId: string }) => {
    try {
      const routes = await db.select().from(transportRoutes)
        .where(and(eq(transportRoutes.eventId, eventId), eq(transportRoutes.isActive, true)))
        .orderBy(desc(transportRoutes.departureTime));

      if (routes.length === 0) return { message: "No se encontraron rutas de transporte activas para este evento." };

      return routes.map((r) => ({
        id: r.id, name: r.name, departurePoint: r.departurePoint,
        departureTime: new Date(r.departureTime).toLocaleString("es-PE"),
        pricePerSeat: `S/ ${Number(r.pricePerSeat).toFixed(2)}`,
        totalSeats: r.totalSeats, description: r.description ?? "Sin descripción",
      }));
    } catch (err) {
      console.error("Error in getEventRoutes:", err);
      return { error: "No se pudieron obtener las rutas de transporte del evento." };
    }
  },
};
