import { db } from "@/lib/db";
import { users, events, registrations } from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";
import { z } from "zod";

export const getEventStats = {
  description: "Obtiene estadísticas clave de la plataforma: usuarios, eventos y registros totales.",
  parameters: z.object({}),
  execute: async () => {
    try {
      const [[{ usersCount }], [{ eventsCount }], [{ regsCount }], [{ publishedCount }]] = await Promise.all([
        db.select({ usersCount: count() }).from(users),
        db.select({ eventsCount: count() }).from(events),
        db.select({ regsCount: count() }).from(registrations),
        db.select({ publishedCount: count() }).from(events).where(eq(events.status, "published")),
      ]);
      return { totalUsers: usersCount, totalEvents: eventsCount, totalRegistrations: regsCount, publishedEvents: publishedCount };
    } catch (err) {
      console.error("Error in getEventStats:", err);
      return { error: "No se pudieron calcular las estadísticas de la plataforma." };
    }
  },
};
