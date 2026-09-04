import { db } from "@/lib/db";
import { registrations, users, events } from "@/lib/db/schema";
import { and, eq, ilike, type SQL } from "drizzle-orm";
import { z } from "zod";
import { canUseOrgDoorChatTools, scopeRegistrationsForChat, type ChatToolScope } from "./scope";
import { formatDateTimeInTimezone } from "@/lib/settings/platform-locale";

export function createGetRegistrationsList(scope: ChatToolScope) {
  if (!canUseOrgDoorChatTools(scope)) {
    return null;
  }

  return {
    description:
      scope.role === "super_admin"
        ? "Obtiene inscripciones de la plataforma. Permite filtrar por evento o estado."
        : scope.role === "admin"
          ? "Obtiene inscripciones de eventos de tu entidad. Permite filtrar por evento o estado."
          : "Obtiene inscripciones de tus eventos. Permite filtrar por evento o estado.",
    parameters: z.object({
      eventQuery: z.string().optional().describe("Título o palabra clave del evento."),
      status: z
        .string()
        .optional()
        .describe("Estado: registered, waitlisted, checked_in, cancelled."),
    }),
    execute: async ({ eventQuery, status }: { eventQuery?: string; status?: string }) => {
      try {
        const conditions: SQL[] = [];
        const scopeCondition = scopeRegistrationsForChat(scope);
        if (scopeCondition) conditions.push(scopeCondition);

        if (status) {
          conditions.push(eq(registrations.status, status as "registered" | "waitlisted" | "checked_in" | "cancelled"));
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

        if (rows.length === 0) return { message: "No se encontraron inscripciones." };

        return rows.map((r) => ({
          id: r.registrationId,
          userName: r.user.name,
          userEmail: r.user.email,
          eventTitle: r.event.title,
          eventDate: formatDateTimeInTimezone(r.event.date, {
            timeZone: scope.timeZone,
            locale: scope.locale,
            dateStyle: "medium",
            timeStyle: "short",
          }),
          status: r.status,
          phone: r.contactPhone ?? "Sin teléfono",
          registeredAt: formatDateTimeInTimezone(r.registeredAt, {
            timeZone: scope.timeZone,
            locale: scope.locale,
            dateStyle: "medium",
          }),
        }));
      } catch (err) {
        console.error("Error in getRegistrationsList:", err);
        return { error: "No se pudo recuperar el listado de inscripciones." };
      }
    },
  };
}
