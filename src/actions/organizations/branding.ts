"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { requireAuthWithHeaders } from "@/lib/auth/guards";
import { OrganizationService } from "@/lib/organizations/organization.service";
import { normalizeRole } from "@/lib/auth/rbac";
import { planIncludesFeature } from "@/lib/billing/enforce";
import { getMyPlanSummary } from "@/actions/billing";

export async function updateOrganizationBranding(input: {
  logoUrl?: string | null;
  accentColor?: string | null;
  brandingEnabled?: boolean;
  whatsappNumber?: string | null;
}) {
  const { user } = await requireAuthWithHeaders();
  const role = normalizeRole(user.role);
  if (role !== "admin" && role !== "super_admin" && role !== "organizer") {
    throw new Error("No autorizado");
  }

  const org = await OrganizationService.getOrganizationForUser(user.id);
  if (!org) throw new Error("No perteneces a una organización");

  if (role === "organizer" && org.ownerId !== user.id) {
    // organizadores pueden editar branding solo si son owner; admin de entidad sí
  }
  if (role === "organizer") {
    throw new Error("Solo el administrador de la entidad puede editar el branding");
  }

  const planSummary = await getMyPlanSummary().catch(() => null);
  const canBrand = planSummary
    ? planIncludesFeature(planSummary.plan, "customBranding", planSummary.isUnlimited)
    : false;

  if ((input.brandingEnabled || input.logoUrl || input.accentColor) && !canBrand && role !== "super_admin") {
    throw new Error("Tu plan no incluye branding personalizado. Actualiza a Pro o Enterprise.");
  }

  const accent = input.accentColor?.trim() || null;
  if (accent && !/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(accent)) {
    throw new Error("Color inválido. Usa formato #RGB o #RRGGBB.");
  }

  await db
    .update(organizations)
    .set({
      ...(input.logoUrl !== undefined && { logoUrl: input.logoUrl?.trim() || null }),
      ...(input.accentColor !== undefined && { accentColor: accent }),
      ...(input.brandingEnabled !== undefined && {
        brandingEnabled: Boolean(input.brandingEnabled) && (canBrand || role === "super_admin"),
      }),
      ...(input.whatsappNumber !== undefined && {
        whatsappNumber: input.whatsappNumber?.trim() || null,
      }),
      updatedAt: new Date(),
    })
    .where(eq(organizations.id, org.id));

  revalidatePath("/admin/settings");
  revalidatePath("/organizer/settings");
  revalidatePath("/admin/onboarding");
  return { success: true as const };
}
