import { cache } from "react";
import { BRAND } from "@/lib/brand";
import { getSystemSettings, type SystemSettings } from "@/lib/settings";
import {
  DEFAULT_ACCENT_COLOR,
  isAccentColor,
  type AccentColor,
} from "@/lib/brand/accent";

export type PlatformSocialLinks = {
  facebook: string;
  instagram: string;
  x: string;
  linkedIn: string;
  whatsApp: string;
  youtube: string;
};

/** Marca efectiva: settings de Superadmin + defaults de código. */
export type PlatformBrand = {
  name: string;
  supportEmail: string;
  contactEmail: string;
  location: string;
  social: PlatformSocialLinks;
  domain: string;
  botName: string;
  logo: typeof BRAND.logo;
  /** Color de acento por defecto de toda la plataforma. */
  defaultAccentColor: AccentColor;
  termsUrl: string;
  privacyUrl: string;
};

export function brandFromSettings(
  input: Partial<SystemSettings> & {
    organizationName?: string | null;
    supportEmail?: string | null;
  } = {},
): PlatformBrand {
  const name = (input.organizationName?.trim() || BRAND.name).trim();
  const supportEmail = (input.supportEmail?.trim() || BRAND.supportEmail).trim();
  const contactEmail =
    (input.publicContactEmail?.trim() || supportEmail || BRAND.contactEmail).trim();

  const accent = input.defaultAccentColor;
  return {
    name,
    supportEmail,
    contactEmail,
    location: (input.publicLocation ?? "").trim(),
    social: {
      facebook: (input.socialFacebook ?? "").trim(),
      instagram: (input.socialInstagram ?? "").trim(),
      x: (input.socialX ?? "").trim(),
      linkedIn: (input.socialLinkedIn ?? "").trim(),
      whatsApp: (input.socialWhatsApp ?? "").trim(),
      youtube: (input.socialYoutube ?? "").trim(),
    },
    domain: BRAND.domain,
    botName: `${name.replace(/\s+/g, "")}Bot`,
    logo: BRAND.logo,
    defaultAccentColor: isAccentColor(accent) ? accent : DEFAULT_ACCENT_COLOR,
    termsUrl: (input.termsUrl ?? "").trim(),
    privacyUrl: (input.privacyUrl ?? "").trim(),
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
