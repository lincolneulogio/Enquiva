/** Normaliza un número a digitos internacionales (sin +). */
export function normalizeWhatsAppNumber(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 9) return null;
  if (digits.length === 9 && digits.startsWith("9")) return `51${digits}`;
  return digits;
}

export function buildWhatsAppChatUrl(options: {
  phone?: string | null;
  text: string;
}) {
  const encoded = encodeURIComponent(options.text);
  const phone = normalizeWhatsAppNumber(options.phone);
  if (phone) {
    return `https://wa.me/${phone}?text=${encoded}`;
  }
  return `https://api.whatsapp.com/send?text=${encoded}`;
}

export function buildEventBroadcastWhatsAppText(options: {
  eventTitle: string;
  message: string;
  eventUrl?: string | null;
  locale?: "es" | "en";
}) {
  const isEn = options.locale === "en";
  const link = options.eventUrl ? `\n\n${options.eventUrl}` : "";
  if (isEn) {
    return `${options.eventTitle}\n\n${options.message}${link}`.trim();
  }
  return `${options.eventTitle}\n\n${options.message}${link}`.trim();
}
