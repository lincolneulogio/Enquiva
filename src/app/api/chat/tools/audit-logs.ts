import { db } from "@/lib/db";
import { activityLogs } from "@/lib/db/schema";
import { z } from "zod";
import { and, desc, eq, type SQL } from "drizzle-orm";
import {
  activityLogInOrgCondition,
} from "@/lib/organizations/admin-scope";
import { canUsePlatformAuditTools, canUseScopedAuditTools, type ChatToolScope } from "./scope";
import { logChatToolUse } from "@/lib/chat/tool-audit";
import { formatDateTimeInTimezone } from "@/lib/settings/platform-locale";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

function buildAuditWhere(scope: ChatToolScope, filters: { action?: string; entityType?: string }): SQL | undefined {
  const conditions: SQL[] = [];

  if (scope.role === "admin" && scope.adminScope.mode === "org") {
    conditions.push(activityLogInOrgCondition(scope.adminScope.organizationId));
  }

  if (filters.action) {
    conditions.push(eq(activityLogs.action, filters.action));
  }
  if (filters.entityType) {
    conditions.push(eq(activityLogs.entityType, filters.entityType));
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

export function createGetAuditLogs(scope: ChatToolScope) {
  if (!canUsePlatformAuditTools(scope) && !canUseScopedAuditTools(scope)) {
    return null;
  }

  const scopeLabel =
    scope.role === "super_admin"
      ? "plataforma"
      : scope.adminScope.mode === "org"
        ? `entidad ${scope.adminScope.organizationName}`
        : "organización";

  return {
    description: `Obtiene logs de auditoría de seguridad (${scopeLabel}). Por defecto 20 registros; máximo 50. Filtros opcionales por acción o módulo.`,
    parameters: z.object({
      limit: z
        .number()
        .int()
        .min(1)
        .max(MAX_LIMIT)
        .optional()
        .describe(`Cantidad de registros (1-${MAX_LIMIT}, default ${DEFAULT_LIMIT}).`),
      action: z.string().optional().describe("Filtrar por acción exacta (ej. broadcast.send, user.delete)."),
      entityType: z
        .string()
        .optional()
        .describe("Filtrar por módulo (user, event, payment, notification, chat)."),
    }),
    execute: async ({
      limit,
      action,
      entityType,
    }: {
      limit?: number;
      action?: string;
      entityType?: string;
    }) => {
      try {
        const safeLimit = Math.min(limit ?? DEFAULT_LIMIT, MAX_LIMIT);
        const whereClause = buildAuditWhere(scope, { action, entityType });

        const logs = await db
          .select()
          .from(activityLogs)
          .where(whereClause)
          .orderBy(desc(activityLogs.createdAt))
          .limit(safeLimit);

        await logChatToolUse(
          { id: scope.userId, name: scope.userName },
          "getAuditLogs",
          `Consulta de auditoría (${scopeLabel}): ${logs.length} registros. Filtros: action=${action ?? "—"}, entityType=${entityType ?? "—"}.`,
          "chat",
        );

        if (logs.length === 0) {
          return { message: "No se encontraron logs de auditoría con los filtros indicados." };
        }

        return {
          scope: scopeLabel,
          totalReturned: logs.length,
          logs: logs.map((l) => ({
            id: l.id,
            date: formatDateTimeInTimezone(l.createdAt, {
              timeZone: scope.timeZone,
              locale: scope.locale,
              dateStyle: "medium",
              timeStyle: "short",
            }),
            actor: l.actorName,
            action: l.action,
            module: l.entityType,
            details: l.details ?? "Sin detalles",
          })),
        };
      } catch (err) {
        console.error("Error in getAuditLogs:", err);
        return { error: "No se pudieron recuperar los logs de auditoría de seguridad." };
      }
    },
  };
}
