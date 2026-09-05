"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, organizations } from "@/lib/db/schema";
import { requireAuthWithHeaders } from "@/lib/auth/guards";
import { OrganizationService } from "@/lib/organizations/organization.service";
import { normalizeRole } from "@/lib/auth/rbac";

export async function saveOrganizerContactAction(whatsappNumber: string | null) {
  const { user } = await requireAuthWithHeaders();
  const role = normalizeRole(user.role);
  if (role !== "admin" && role !== "super_admin" && role !== "organizer") {
    throw new Error("No autorizado");
  }

  const cleanWa = whatsappNumber?.trim() || null;

  // 1. Actualizar teléfono en la tabla users
  await db
    .update(users)
    .set({
      phone: cleanWa,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));

  // 2. Si pertenece a una organización, actualizar también el WhatsApp de la organización
  const org = await OrganizationService.getOrganizationForUser(user.id);
  if (org) {
    await db
      .update(organizations)
      .set({
        whatsappNumber: cleanWa,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, org.id));
  }

  revalidatePath("/organizer/settings");
  revalidatePath("/admin/settings");
  revalidatePath("/events");

  return { success: true, whatsappNumber: cleanWa };
}
