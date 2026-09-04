import { db } from "@/lib/db";
import { transportRoutes } from "@/lib/db/schema";
import { and, eq, desc } from "drizzle-orm";
import { z } from "zod";
import { assertEventInAdminScope } from "@/lib/organizations/admin-scope";
import { canUseStaffChatTools, type ChatToolScope } from "./scope";
import { formatDateTimeInTimezone } from "@/lib/settings/platform-locale";

export function createGetEventRoutes(scope: ChatToolScope) {
  if (!canUseStaffChatTools(scope)) {
    return null;
  }

  return {
    description: "Obtiene las rutas de transporte activas de un evento que puedes gestionar.",
    parameters: z.object({
      eventId: z.string().uuid().describe("El ID único del evento."),
    }),
    execute: async ({ eventId }: { eventId: string }) => {
      try {
        await assertEventInAdminScope(eventId, scope.userId, scope.role);

        const routes = await db
          .select()
          .from(transportRoutes)
          .where(and(eq(transportRoutes.eventId, eventId), eq(transportRoutes.isActive, true)))
          .orderBy(desc(transportRoutes.departureTime));

        if (routes.length === 0) {
          return { message: "No se encontraron rutas de transporte activas para este evento." };
        }

        return routes.map((r) => ({
          id: r.id,
          name: r.name,
          departurePoint: r.departurePoint,
          departureTime: formatDateTimeInTimezone(r.departureTime, {
            timeZone: scope.timeZone,
            locale: scope.locale,
            dateStyle: "medium",
            timeStyle: "short",
          }),
          pricePerSeat: `S/ ${Number(r.pricePerSeat).toFixed(2)}`,
          totalSeats: r.totalSeats,
          description: r.description ?? "Sin descripción",
        }));
      } catch (err) {
        console.error("Error in getEventRoutes:", err);
        return {
          error: err instanceof Error ? err.message : "No se pudieron obtener las rutas del evento.",
        };
      }
    },
  };
}
