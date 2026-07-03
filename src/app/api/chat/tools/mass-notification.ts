import { db } from "@/lib/db";
import { users, events, registrations, activityLogs, notifications, transportRoutes, transportBookings } from "@/lib/db/schema";
import { sendPushNotification } from "@/lib/notifications/push";
import { sendCustomNotificationEmail } from "@/lib/mail";
import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { assertEventInAdminScope, assertRouteInAdminScope } from "@/lib/organizations/admin-scope";
import { canUseStaffChatTools, type ChatToolScope } from "./scope";

type Recipient = { id: string; name: string; email: string };

export function createSendMassNotification(scope: ChatToolScope) {
  if (!canUseStaffChatTools(scope)) {
    return null;
  }

  return {
    description:
      "Envía notificación masiva a asistentes de un evento o pasajeros de una ruta que gestionas. Pide confirmación antes de enviar.",
    parameters: z.object({
      eventId: z.string().uuid().describe("El ID único del evento."),
      target: z.enum(["all_attendees", "route_passengers"]).describe("El grupo objetivo."),
      routeId: z.string().uuid().optional().describe("Obligatorio si target es route_passengers."),
      title: z.string().describe("Título o asunto de la notificación."),
      body: z.string().describe("Contenido de la notificación."),
    }),
    execute: async ({
      eventId,
      target,
      routeId,
      title,
      body,
    }: {
      eventId: string;
      target: "all_attendees" | "route_passengers";
      routeId?: string;
      title: string;
      body: string;
    }) => {
      try {
        await assertEventInAdminScope(eventId, scope.userId, scope.role);

        const [event] = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
        if (!event) return { error: "El evento especificado no existe." };

        let recipients: Recipient[] = [];

        if (target === "all_attendees") {
          recipients = await db
            .select({ id: users.id, name: users.name, email: users.email })
            .from(registrations)
            .innerJoin(users, eq(registrations.userId, users.id))
            .where(and(eq(registrations.eventId, eventId), ne(registrations.status, "cancelled")));
        } else {
          if (!routeId) return { error: "El parámetro routeId es obligatorio para pasajeros de una ruta." };
          await assertRouteInAdminScope(routeId, scope.userId, scope.role);

          const [route] = await db.select().from(transportRoutes).where(eq(transportRoutes.id, routeId)).limit(1);
          if (!route || route.eventId !== eventId) {
            return { error: "La ruta no pertenece al evento indicado." };
          }

          recipients = await db
            .select({ id: users.id, name: users.name, email: users.email })
            .from(transportBookings)
            .innerJoin(users, eq(transportBookings.userId, users.id))
            .where(and(eq(transportBookings.routeId, routeId), ne(transportBookings.status, "cancelled")));
        }

        if (recipients.length === 0) return { message: "No se encontraron destinatarios activos." };

        const unique = Array.from(new Map(recipients.map((r) => [r.id, r])).values());
        let successCount = 0;
        let failCount = 0;

        await Promise.all(
          unique.map(async (user) => {
            try {
              await db.insert(notifications).values({
                userId: user.id,
                type: "event_reminder",
                title,
                message: body,
                read: false,
                metadata: { eventId, routeId: routeId || null, sentBy: scope.userId, targetGroup: target },
              });
              await sendPushNotification(user.id, title, body).catch((e) => console.error("Push failed:", e));
              await sendCustomNotificationEmail({ email: user.email, name: user.name, subject: title, body }).catch(
                (e) => console.error("Email failed:", e),
              );
              successCount++;
            } catch {
              failCount++;
            }
          }),
        );

        await db
          .insert(activityLogs)
          .values({
            actorId: scope.userId,
            actorName: scope.userName,
            action: "send_mass_notification",
            entityType: "notification",
            entityId: eventId,
            details: `Notificación masiva enviada a ${successCount} destinatarios. Asunto: "${title}".`,
          })
          .catch((e) => console.error("Audit log failed:", e));

        return {
          success: true,
          totalSent: successCount,
          totalFailed: failCount,
          message: `Se enviaron ${successCount} notificaciones (fallaron ${failCount}).`,
        };
      } catch (err) {
        console.error("Error in sendMassNotification:", err);
        return {
          error: err instanceof Error ? err.message : "Error inesperado al procesar el envío masivo.",
        };
      }
    },
  };
}
