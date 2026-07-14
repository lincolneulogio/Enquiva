import { cache } from "react";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { getResolvedPlanForUser, planIncludesFeature } from "@/lib/billing/enforce";

export type OrgPublicBrand = {
  organizationId: string;
  name: string;
  logoUrl: string | null;
  accentColor: string | null;
  whatsappNumber: string | null;
  active: boolean;
};

/**
 * Branding público de org: solo si el plan incluye customBranding y brandingEnabled.
 */
export const getOrgPublicBrand = cache(
  async (organizationId: string | null | undefined): Promise<OrgPublicBrand | null> => {
    if (!organizationId) return null;

    const [org] = await db
      .select({
        id: organizations.id,
        name: organizations.name,
        logoUrl: organizations.logoUrl,
        accentColor: organizations.accentColor,
        brandingEnabled: organizations.brandingEnabled,
        whatsappNumber: organizations.whatsappNumber,
        ownerId: organizations.ownerId,
      })
      .from(organizations)
      .where(eq(organizations.id, organizationId))
      .limit(1);

    if (!org) return null;

    const plan = await getResolvedPlanForUser(org.ownerId, "admin").catch(() => null);
    const allowed = plan ? planIncludesFeature(plan, "customBranding") : false;
    const active = Boolean(org.brandingEnabled && allowed);

    return {
      organizationId: org.id,
      name: org.name,
      logoUrl: active ? org.logoUrl : null,
      accentColor: active ? org.accentColor : null,
      whatsappNumber: org.whatsappNumber,
      active,
    };
  },
);
