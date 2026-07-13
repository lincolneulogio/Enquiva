import { cache } from "react";
import { BRAND } from "@/lib/brand";
import { getSystemSettings } from "@/lib/settings";

/** Marca efectiva: settings de Superadmin + defaults de código. */
export type PlatformBrand = {
  name: string;
  supportEmail: string;
  contactEmail: string;
  domain: string;
  botName: string;
  logo: typeof BRAND.logo;
};

export function brandFromSettings(input: {
  organizationName?: string | null;
  supportEmail?: string | null;
}): PlatformBrand {
  const name = (input.organizationName?.trim() || BRAND.name).trim();
  const supportEmail = (input.supportEmail?.trim() || BRAND.supportEmail).trim();
  return {
    name,
    supportEmail,
    contactEmail: BRAND.contactEmail,
    domain: BRAND.domain,
    botName: `${name.replace(/\s+/g, "")}Bot`,
    logo: BRAND.logo,
  };
}

/** Server-only: marca actual desde BD (cache por request). */
export const getPlatformBrand = cache(async (): Promise<PlatformBrand> => {
  try {
    const settings = await getSystemSettings();
    return brandFromSettings(settings);
  } catch {
    return brandFromSettings({});
  }
});
