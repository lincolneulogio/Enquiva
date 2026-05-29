import { db } from "@/lib/db";
import { users, events, registrations, activityLogs, notifications, transportRoutes, transportBookings } from "@/lib/db/schema";
import { sendPushNotification } from "@/lib/notifications/push";
import { sendCustomNotificationEmail } from "@/lib/mail";
import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";

type Recipient = { id: string; name: string; email: string };

export const sendMassNotification = (userId: string, userName: string) => ({
  description: "Envía notificación masiva (in-app, push, email) a asistentes de un evento o pasajeros de una ruta. ¡IMPORTANTE! Muestra borrador y pide confirmación explícita antes de invocar.",
  parameters: z.object({
    eventId: z.string().uuid().describe("El ID único del evento."),
    target: z.enum(["all_attendees", "route_passengers"]).describe("El grupo objetivo."),
    routeId: z.string().uuid().optional().describe("El ID de la ruta (obligatorio si target es 'route_passengers')."),
    title: z.string().describe("El título o asunto de la notificación."),
    body: z.string().describe("El contenido detallado de la notificación."),
  }),
  execute: async ({ eventId, target, routeId, title, body }: { eventId: string; target: "all_attendees" | "route_passengers"; routeId?: string; title: string; body: string }) => {
    try {
      const [event] = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
      if (!event) return { error: "El evento especificado no existe." };

      let recipients: Recipient[] = [];

      if (target === "all_attendees") {
        recipients = await db.select({ id: users.id, name: users.name, email: users.email })
          .from(registrations).innerJoin(users, eq(registrations.userId, users.id))
          .where(and(eq(registrations.eventId, eventId), ne(registrations.status, "cancelled")));
      } else {
        if (!routeId) return { error: "El parámetro routeId es obligatorio para pasajeros de una ruta." };
        const [route] = await db.select().from(transportRoutes).where(eq(transportRoutes.id, routeId)).limit(1);
        if (!route) return { error: "La ruta de transporte especificada no existe." };
        recipients = await db.select({ id: users.id, name: users.name, email: users.email })
          .from(transportBookings).innerJoin(users, eq(transportBookings.userId, users.id))
          .where(and(eq(transportBookings.routeId, routeId), ne(transportBookings.status, "cancelled")));
      }

      if (recipients.length === 0) return { message: "No se encontraron destinatarios activos." };

      const unique = Array.from(new Map(recipients.map((r) => [r.id, r])).values());
      let successCount = 0, failCount = 0;

      await Promise.all(unique.map(async (user) => {
        try {
          await db.insert(notifications).values({
            userId: user.id, type: "event_reminder", title, message: body, read: false,
            metadata: { eventId, routeId: routeId || null, sentBy: userId, targetGroup: target },
          });
          await sendPushNotification(user.id, title, body).catch((e) => console.error("Push failed:", e));
          await sendCustomNotificationEmail({ email: user.email, name: user.name, subject: title, body }).catch((e) => console.error("Email failed:", e));
          successCount++;
        } catch { failCount++; }
      }));

      await db.insert(activityLogs).values({
        actorId: userId, actorName: userName, action: "send_mass_notification",
        entityType: "notification", entityId: eventId,
        details: `Notificación masiva enviada a ${successCount} destinatarios. Asunto: "${title}".`,
      }).catch((e) => console.error("Audit log failed:", e));

      return { success: true, totalSent: successCount, totalFailed: failCount, message: `Se enviaron ${successCount} notificaciones (fallaron ${failCount}).` };
    } catch (err) {
      console.error("Error in sendMassNotification:", err);
      return { error: "Error inesperado al procesar el envío masivo." };
    }
  },
});
