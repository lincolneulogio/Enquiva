import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { and, eq, ilike, or, type SQL } from "drizzle-orm";
import { z } from "zod";
import { canUseScopedUserList, scopeUsersForChat, type ChatToolScope } from "./scope";
import { logChatToolUse } from "@/lib/chat/tool-audit";

export function createGetUsersList(scope: ChatToolScope) {
  if (!canUseScopedUserList(scope)) {
    return null;
  }

  return {
    description:
      scope.role === "super_admin"
        ? "Obtiene usuarios registrados en la plataforma. Permite buscar por nombre/email y filtrar por rol."
        : "Obtiene usuarios de tu entidad. Permite buscar por nombre/email y filtrar por rol (member, organizer, admin).",
    parameters: z.object({
      query: z.string().optional().describe("Texto opcional para buscar por nombre o email."),
      role: z.string().optional().describe("Filtrar por rol: admin, organizer, member."),
    }),
    execute: async ({ query, role }: { query?: string; role?: string }) => {
      try {
        const conditions: SQL[] = [];
        const scopeCondition = scopeUsersForChat(scope);
        if (scopeCondition) conditions.push(scopeCondition);

        if (scope.role === "admin" && role === "super_admin") {
          return { error: "No puedes listar usuarios con rol super_admin." };
        }

        if (role) {
          conditions.push(eq(users.role, role as "admin" | "organizer" | "member" | "super_admin"));
        }

        if (query) {
          conditions.push(or(ilike(users.name, `%${query}%`), ilike(users.email, `%${query}%`))!);
        }

        const rows = await db
          .select()
          .from(users)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .limit(50);

        if (rows.length === 0) return { message: "No se encontraron usuarios." };

        await logChatToolUse(
          { id: scope.userId, name: scope.userName },
          "getUsersList",
          `Listado de usuarios: ${rows.length} resultados. query=${query ?? "—"}, role=${role ?? "—"}.`,
          "user",
        );

        return rows.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          phone: u.phone ?? "Sin teléfono",
          role: u.role,
          bio: u.bio ?? "Sin biografía",
          isActive: u.isActive ? "Activo" : "Inactivo",
          registeredAt: new Date(u.createdAt).toLocaleDateString("es-PE"),
        }));
      } catch (err) {
        console.error("Error in getUsersList:", err);
        return { error: "No se pudo recuperar la lista de usuarios." };
      }
    },
  };
}
