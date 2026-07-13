import { BRAND } from "@/lib/brand";

export type InviteShareLocale = "es" | "en";

export type InviteShareChannel =
  | "whatsapp"
  | "facebook"
  | "x"
  | "linkedin"
  | "telegram"
  | "email";

export function getRegisterInviteUrl(appUrl: string, inviteCode: string) {
  const base = appUrl.replace(/\/$/, "");
  return `${base}/register?invite=${encodeURIComponent(inviteCode.trim().toUpperCase())}`;
}

export function buildInviteShareMessage(options: {
  inviteCode: string;
  entityName?: string;
  appUrl: string;
  locale: InviteShareLocale;
  platformName?: string;
}) {
  const code = options.inviteCode.trim().toUpperCase();
  const registerUrl = getRegisterInviteUrl(options.appUrl, code);
  const entity = options.entityName?.trim();
  const platform = options.platformName?.trim() || BRAND.name;

  if (options.locale === "en") {
    const intro = entity
      ? `Join ${entity} as an event organizer on ${platform}.`
      : `Join us as an event organizer on ${platform}.`;
    return `${intro}\n\nInvite code: ${code}\nRegister: ${registerUrl}\n\nChoose Organizer → With an entity and enter the code.`;
  }

  const intro = entity
    ? `Únete a ${entity} como organizador de eventos en ${platform}.`
    : `Únete como organizador de eventos en ${platform}.`;
  return `${intro}\n\nCódigo de invitación: ${code}\nRegistro: ${registerUrl}\n\nElige Organizador → Con una entidad e ingresa el código.`;
}

export function buildInviteShareUrl(
  channel: InviteShareChannel,
  options: {
    inviteCode: string;
    entityName?: string;
    appUrl: string;
    locale: InviteShareLocale;
    platformName?: string;
  },
) {
  const message = buildInviteShareMessage(options);
  const registerUrl = getRegisterInviteUrl(options.appUrl, options.inviteCode);
  const encodedMessage = encodeURIComponent(message);
  const encodedUrl = encodeURIComponent(registerUrl);
  const platform = options.platformName?.trim() || BRAND.name;

  switch (channel) {
    case "whatsapp":
      return `https://api.whatsapp.com/send?text=${encodedMessage}`;
    case "telegram":
      return `https://t.me/share/url?url=${encodedUrl}&text=${encodedMessage}`;
    case "facebook":
      return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedMessage}`;
    case "x":
      return `https://twitter.com/intent/tweet?text=${encodedMessage}`;
    case "linkedin":
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
    case "email": {
      const subject =
        options.locale === "en"
          ? `Invitation to join ${entityNameOrFallback(options.entityName, "our entity")} on ${platform}`
          : `Invitación a unirte a ${entityNameOrFallback(options.entityName, "nuestra entidad")} en ${platform}`;
      return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodedMessage}`;
    }
  }
}

function entityNameOrFallback(name: string | undefined, fallback: string) {
  return name?.trim() || fallback;
}

export function canUseNativeShare() {
  return typeof navigator !== "undefined" && typeof navigator.share === "function";
}
