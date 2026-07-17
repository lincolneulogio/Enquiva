import { z } from "zod";
import { canUseStaffChatTools, type ChatToolScope } from "./scope";
import { DEFAULT_MASS_CHANNELS } from "@/lib/notifications/mass-communication";
import { enqueueResolvedBroadcastJob } from "@/lib/notifications/broadcast-queue";
import {
  consumeMassNotificationConfirmation,
  storeMassNotificationConfirmation,
} from "@/lib/chat/mass-notification-confirm";
import { maskEmail, resolveMassNotificationRecipients } from "@/lib/chat/resolve-mass-recipients";
import { logChatToolUse } from "@/lib/chat/tool-audit";

const massNotificationParams = z.object({
  eventId: z.string().uuid().describe("El ID único del evento."),
  target: z.enum(["all_attendees", "route_passengers"]).describe("El grupo objetivo."),
  routeId: z.string().uuid().optional().describe("Obligatorio si target es route_passengers."),
  title: z.string().describe("Título o asunto de la notificación."),
  body: z.string().describe("Contenido de la notificación."),
});

export function createPreviewMassNotification(scope: ChatToolScope) {
  if (!canUseStaffChatTools(scope)) {
    return null;
  }

  return {
    description:
      "Vista previa (dry-run) de notificación masiva. NO envía nada. Devuelve conteo de destinatarios, muestra de nombres y un confirmationId válido 10 minutos. Obligatorio antes de sendMassNotification.",
    parameters: massNotificationParams,
    execute: async (input: z.infer<typeof massNotificationParams>) => {
      try {
        const resolved = await resolveMassNotificationRecipients({
          eventId: input.eventId,
          target: input.target,
          routeId: input.routeId,
          actorId: scope.userId,
          actorRole: scope.role,
        });

        if (!resolved.ok) {
          return { error: resolved.error };
        }

        const { recipients, eventTitle } = resolved;

        if (recipients.length === 0) {
          return { message: "No se encontraron destinatarios activos para el filtro indicado." };
        }

        const confirmationId = await storeMassNotificationConfirmation({
          userId: scope.userId,
          eventId: input.eventId,
          eventTitle,
          target: input.target,
          routeId: input.routeId,
          title: input.title,
          body: input.body,
          recipientCount: recipients.length,
        });

        const sample = recipients.slice(0, 8).map((r) => ({
          name: r.name ?? "Sin nombre",
          email: maskEmail(r.email),
        }));

        await logChatToolUse(
          { id: scope.userId, name: scope.userName },
          "previewMassNotification",
          `Dry-run: "${input.title}" → ${recipients.length} destinatarios (${input.target}) en evento "${eventTitle}". confirmationId=${confirmationId}`,
          "event",
          input.eventId,
        );

        return {
          dryRun: true,
          confirmationId,
          expiresInMinutes: 10,
          eventTitle,
          target: input.target,
          recipientCount: recipients.length,
          channels: ["email", "in-app", "push", "pusher"],
          sampleRecipients: sample,
          title: input.title,
          body: input.body,
          instructions:
            "Muestra este resumen al usuario y pregunta si desea enviar. Solo si confirma, llama sendMassNotification con el mismo confirmationId.",
        };
      } catch (err) {
        console.error("Error in previewMassNotification:", err);
        return {
          error: err instanceof Error ? err.message : "Error al generar la vista previa.",
        };
      }
    },
  };
}

export function createSendMassNotification(scope: ChatToolScope) {
  if (!canUseStaffChatTools(scope)) {
    return null;
  }

  return {
    description:
      "Envía notificación masiva confirmada. Requiere confirmationId de previewMassNotification. Sin token válido no se envía nada.",
    parameters: z.object({
      confirmationId: z
        .string()
        .uuid()
        .describe("ID devuelto por previewMassNotification tras confirmación del usuario."),
    }),
    execute: async ({ confirmationId }: { confirmationId: string }) => {
      try {
        const confirmed = await consumeMassNotificationConfirmation(confirmationId, scope.userId);

        if (!confirmed) {
          return {
            error:
              "confirmationId inválido o expirado. Ejecuta previewMassNotification de nuevo y pide confirmación al usuario.",
          };
        }

        const resolved = await resolveMassNotificationRecipients({
          eventId: confirmed.eventId,
          target: confirmed.target,
          routeId: confirmed.routeId,
          actorId: scope.userId,
          actorRole: scope.role,
        });

        if (!resolved.ok) {
          return { error: resolved.error };
        }

        const { recipients, eventTitle } = resolved;

        if (recipients.length === 0) {
          return { message: "No se encontraron destinatarios activos." };
        }

        const queued = await enqueueResolvedBroadcastJob({
          eventId: confirmed.eventId,
          senderId: scope.userId,
          senderName: scope.userName,
          subject: confirmed.title,
          message: confirmed.body,
          recipientStatus: `copilot:${confirmed.target}`,
          locale: "es",
          channels: DEFAULT_MASS_CHANNELS,
        }, recipients);

        if (!queued.success) return { error: queued.error };
        await logChatToolUse(
          { id: scope.userId, name: scope.userName },
          "sendMassNotification",
          `Encolado durablemente: "${confirmed.title}" → ${recipients.length} destinatarios en evento "${eventTitle}". jobId=${queued.jobId}`,
          "event",
          confirmed.eventId,
        );
        return {
          success: true,
          queued: true,
          jobId: queued.jobId,
          totalRecipients: recipients.length,
          message: `Comunicado encolado para ${recipients.length} destinatarios (email, app, push y tiempo real).`,
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
