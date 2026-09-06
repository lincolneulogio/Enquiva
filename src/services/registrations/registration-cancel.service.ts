import { db } from "@/lib/db";
import { registrations } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { CACHE_KEYS, invalidateCache } from "@/lib/redis";
import { publishRegistrationRealtime } from "@/lib/pusher/registration-live";
import { runBackground } from "@/lib/background";
import { RegistrationErrorCode, registrationError } from "@/lib/errors/registration";
import {
  promoteNextWaitlisted,
  releaseRegistrationResources,
} from "@/lib/registrations/cleanup";
import { NotificationService } from "@/lib/notifications/notification.service";

export class RegistrationCancelService {
  /**
   * Cancela la inscripción de un usuario a un evento.
   * Garantiza la consistencia liberando tickets y promoviendo listas de espera transaccionalmente.
   */
  static async cancelRegistration(registrationId: string, userId: string, password?: string) {
    try {
      const { verifyAccountPassword } = await import(
        "@/lib/auth/verify-account-password"
      );
      await verifyAccountPassword(userId, password);
    } catch (error) {
      const { AccountPasswordError } = await import("@/lib/auth/verify-account-password");
      if (error instanceof AccountPasswordError) {
        if (error.code === "PASSWORD_NOT_SET" || error.code === "PASSWORD_REQUIRED") {
          throw registrationError(RegistrationErrorCode.PASSWORD_REQUIRED);
        }
        throw registrationError(RegistrationErrorCode.PASSWORD_INVALID);
      }
      throw error;
    }

    return db.transaction(async (tx) => {
      // 1. Obtener la inscripción activa
      const [reg] = await tx
        .select()
        .from(registrations)
        .where(
          and(eq(registrations.id, registrationId), eq(registrations.userId, userId))
        )
        .limit(1);

      if (!reg) throw registrationError(RegistrationErrorCode.NOT_FOUND);

      // 3. Cancelar la inscripción y liberar recursos asociados
      await releaseRegistrationResources(tx, reg);

      await tx
        .update(registrations)
        .set({ status: "cancelled", holdExpiresAt: null, holdReminderSentAt: null })
        .where(eq(registrations.id, registrationId));

      const promotion = await promoteNextWaitlisted(tx, reg.eventId);

      runBackground(async () => {
        await invalidateCache(CACHE_KEYS.userNotificationsCount(userId));
        if (promotion?.userId) {
          await NotificationService.deliver([promotion.payload]);
        }

        try {
          await publishRegistrationRealtime({
            eventId: reg.eventId,
            userId,
            status: promotion?.userId ? "registered" : undefined,
            source: promotion?.userId ? "waitlist_promoted" : undefined,
            resource: ["registrations", "attendees", "events", "payments", "transport"],
          });
        } catch (error) {
          console.error("Fallo al actualizar contador tras cancelación", error);
        }
      });

      return { success: true };
    });
  }
}
