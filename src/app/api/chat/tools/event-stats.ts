import { db } from "@/lib/db";
import { users, events, registrations } from "@/lib/db/schema";
import { eq, count, and, type SQL } from "drizzle-orm";
import { z } from "zod";
import {
  canUseStaffChatTools,
  scopeEventsForChat,
  scopeRegistrationsForChat,
  scopeUsersForChat,
  type ChatToolScope,
} from "./scope";

export function createGetEventStats(scope: ChatToolScope) {
  if (!canUseStaffChatTools(scope)) {
    return null;
  }

  return {
      description:
        scope.role === "super_admin"
          ? "Estadísticas globales de la plataforma: total de eventos, publicados, inscripciones y usuarios. Úsala para preguntas como '¿cuántos eventos hay?'."
          : scope.role === "admin"
            ? "Estadísticas de tu entidad: eventos, publicados, inscripciones y usuarios. Úsala para '¿cuántos eventos hay?'."
            : "Estadísticas de tus eventos: totales, publicados e inscripciones. Úsala para '¿cuántos eventos hay?'.",
      parameters: z.object({}),
    execute: async () => {
      try {
        const eventScope = scopeEventsForChat(scope);
        const userScope = scopeUsersForChat(scope);
        const registrationScope = scopeRegistrationsForChat(scope);

        const eventWhere = eventScope ? and(eventScope) : undefined;
        const userWhere = userScope ? and(userScope) : undefined;

        const [[{ eventsCount }], [{ publishedCount }], [{ regsCount }], [{ usersCount }]] =
          await Promise.all([
            db.select({ eventsCount: count() }).from(events).where(eventWhere),
            db
              .select({ publishedCount: count() })
              .from(events)
              .where(eventWhere ? and(eventWhere, eq(events.status, "published")) : eq(events.status, "published")),
            registrationScope
              ? db.select({ regsCount: count() }).from(registrations).where(and(registrationScope))
              : db.select({ regsCount: count() }).from(registrations),
            userScope
              ? db.select({ usersCount: count() }).from(users).where(userWhere)
              : db.select({ usersCount: count() }).from(users),
          ]);

        return {
          totalUsers: usersCount,
          totalEvents: eventsCount,
          totalRegistrations: regsCount,
          publishedEvents: publishedCount,
          scope:
            scope.role === "super_admin"
              ? "plataforma"
              : scope.role === "admin"
                ? "entidad"
                : "tus eventos",
        };
      } catch (err) {
        console.error("Error in getEventStats:", err);
        return { error: "No se pudieron calcular las estadísticas." };
      }
    },
  };
}
