import { BRAND } from "@/lib/brand";

const MAX_PUSH_TITLE_LEN = 64;

/** Título visible en la notificación del SO (marca). */
export function resolvePushNotificationTitle(input: {
  pushNotificationTitle?: string | null;
  organizationName?: string | null;
}): string {
  const custom = (input.pushNotificationTitle ?? "").trim();
  if (custom) return custom.slice(0, MAX_PUSH_TITLE_LEN);
  const org = (input.organizationName ?? "").trim();
  if (org) return org.slice(0, MAX_PUSH_TITLE_LEN);
  return BRAND.name.slice(0, MAX_PUSH_TITLE_LEN);
}

export function normalizePushNotificationTitle(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw.trim().slice(0, MAX_PUSH_TITLE_LEN);
}

/**
 * Formato profesional: marca como título OS; el asunto/mensaje van en el cuerpo.
 */
export function buildBrandedWebPushPayload(
  content: { title: string; body: string; url?: string },
  brandTitle: string,
): { title: string; body: string; url: string } {
  const eventTitle = content.title.trim();
  const eventBody = content.body.trim();
  let body = eventTitle;
  if (eventBody && eventBody !== eventTitle) {
    body = `${eventTitle}\n${eventBody}`;
  } else if (!eventTitle) {
    body = eventBody;
  }

  return {
    title: brandTitle.slice(0, MAX_PUSH_TITLE_LEN) || BRAND.name,
    body: body.slice(0, 240),
    url: content.url?.trim() || "/",
  };
}
