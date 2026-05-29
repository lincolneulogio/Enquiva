import { db } from "@/lib/db";
import { registrations, users, events } from "@/lib/db/schema";
import { and, eq, ilike } from "drizzle-orm";
import { z } from "zod";

export const getRegistrationsList = {
  description: "Obtiene el listado de inscripciones y participantes reales de la base de datos. Permite filtrar por evento (título) o por estado de inscripción.",
  parameters: z.object({
    eventQuery: z.string().optional().describe("Título o palabra clave del evento para buscar sus inscripciones."),
    status: z.string().optional().describe("Estado de inscripción: 'registered', 'waitlisted', 'checked_in', 'cancelled'."),
  }),
  execute: async ({ eventQuery, status }: { eventQuery?: string; status?: string }) => {
    try {
      const conditions = [];

      if (status) {
        conditions.push(eq(registrations.status, status as any));
      }

      if (eventQuery) {
        conditions.push(ilike(events.title, `%${eventQuery}%`));
      }

      const rows = await db
        .select({
          registrationId: registrations.id,
          status: registrations.status,
          contactPhone: registrations.contactPhone,
          registeredAt: registrations.registeredAt,
          user: {
            name: users.name,
            email: users.email,
          },
          event: {
            title: events.title,
            date: events.date,
          },
        })
        .from(registrations)
        .innerJoin(users, eq(registrations.userId, users.id))
        .innerJoin(events, eq(registrations.eventId, events.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .limit(50);

      if (rows.length === 0) return { message: "No se encontraron inscripciones registradas en la base de datos." };

      return rows.map((r) => ({
        id: r.registrationId,
        userName: r.user.name,
        userEmail: r.user.email,
        eventTitle: r.event.title,
        eventDate: new Date(r.event.date).toLocaleDateString("es-PE"),
        status: r.status,
        phone: r.contactPhone ?? "Sin teléfono",
        registeredAt: new Date(r.registeredAt).toLocaleDateString("es-PE"),
      }));
    } catch (err) {
      console.error("Error in getRegistrationsList:", err);
      return { error: "No se pudo recuperar el listado de inscripciones de la base de datos." };
    }
  },
};
