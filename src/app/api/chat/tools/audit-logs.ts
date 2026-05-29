import { db } from "@/lib/db";
import { activityLogs } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { z } from "zod";

export const getAuditLogs = {
  description: "Obtiene los últimos 5 logs de auditoría de seguridad del sistema.",
  parameters: z.object({}),
  execute: async () => {
    try {
      const logs = await db.select().from(activityLogs).orderBy(desc(activityLogs.createdAt)).limit(5);
      if (logs.length === 0) return { message: "No se encontraron logs de auditoría registrados." };
      return logs.map((l) => ({
        id: l.id, date: new Date(l.createdAt).toLocaleString("es-PE"),
        actor: l.actorName, action: l.action, module: l.entityType, details: l.details ?? "Sin detalles",
      }));
    } catch (err) {
      console.error("Error in getAuditLogs:", err);
      return { error: "No se pudieron recuperar los logs de auditoría de seguridad." };
    }
  },
};
