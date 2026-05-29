import { db } from "@/lib/db";
import { events, registrations } from "@/lib/db/schema";
import { and, eq, desc, ne } from "drizzle-orm";
import { z } from "zod";

export const getMyTickets = (userId: string) => ({
  description: "Obtiene las entradas y tickets de eventos activos registrados por el miembro conectado.",
  parameters: z.object({}),
  execute: async () => {
    try {
      const rows = await db.select({
        registrationId: registrations.id, registrationStatus: registrations.status,
        eventTitle: events.title, eventDate: events.date,
        eventLocation: events.location, isVirtual: events.isVirtual,
      }).from(registrations).innerJoin(events, eq(registrations.eventId, events.id))
        .where(and(eq(registrations.userId, userId), ne(registrations.status, "cancelled")))
        .orderBy(desc(registrations.registeredAt));

      if (rows.length === 0) return { message: "Aún no tienes inscripciones o tickets registrados." };

      return rows.map((r) => ({
        ticketId: r.registrationId, event: r.eventTitle,
        date: new Date(r.eventDate).toLocaleString("es-PE"),
        location: r.isVirtual ? "Virtual" : (r.eventLocation ?? "Por confirmar"),
        status: r.registrationStatus === "checked_in" ? "Ingresado (Asistencia confirmada)" : "Registrado (Pendiente de ingreso)",
      }));
    } catch (err) {
      console.error("Error in getMyTickets:", err);
      return { error: "No se pudo cargar tu historial de tickets." };
    }
  },
});
