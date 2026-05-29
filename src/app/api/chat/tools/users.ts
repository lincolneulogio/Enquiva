import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { and, eq, ilike, or } from "drizzle-orm";
import { z } from "zod";

export const getUsersList = {
  description: "Obtiene la lista de usuarios reales registrados en la base de datos de la plataforma. Permite buscar por nombre/email y filtrar por rol.",
  parameters: z.object({
    query: z.string().optional().describe("Texto opcional para buscar por nombre o email del usuario."),
    role: z.string().optional().describe("Filtrar por rol: 'super_admin', 'admin', 'organizer', 'member'."),
  }),
  execute: async ({ query, role }: { query?: string; role?: string }) => {
    try {
      const conditions = [];

      if (role) {
        conditions.push(eq(users.role, role as any));
      }

      if (query) {
        conditions.push(
          or(
            ilike(users.name, `%${query}%`),
            ilike(users.email, `%${query}%`)
          )
        );
      }

      const rows = await db.select().from(users)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .limit(50);

      if (rows.length === 0) return { message: "No se encontraron usuarios en la base de datos." };

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
      return { error: "No se pudo recuperar la lista de usuarios de la base de datos." };
    }
  },
};
