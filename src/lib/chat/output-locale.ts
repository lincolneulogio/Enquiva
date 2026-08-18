import { resolveLocale, type Locale } from "@/lib/i18n/core";

export function parseChatLocale(value: unknown, fallback: Locale = "es"): Locale {
  if (typeof value !== "string") return fallback;
  return resolveLocale(value);
}

/** Instrucción final (lo último que ve el modelo gana). */
export function chatOutputLanguageLock(locale: Locale): string {
  if (locale === "en") {
    return `OUTPUT LANGUAGE LOCK (mandatory):
Reply to the user entirely in English. Do not mix Spanish. Do not alternate languages in the same answer.
Keep product names as-is (Enquiva, EnquivaBot, Culqi). Plain text, no markdown asterisks.`;
  }

  return `BLOQUEO DE IDIOMA DE SALIDA (obligatorio):
Responde al usuario enteramente en español. Prohibido mezclar inglés. Prohibido un párrafo en español y otro en inglés.
Conserva nombres de producto (Enquiva, EnquivaBot, Culqi). Texto plano, sin asteriscos de markdown.`;
}

export function chatStyleLine(locale: Locale): string {
  if (locale === "en") {
    return "STYLE: professional English, plain text, no markdown ** or headings, no emojis. Max 8 lines. Stick to the facts.";
  }
  return "ESTILO: español profesional, texto plano. Prohibido markdown: nada de **asteriscos**, # títulos ni emojis. Máximo 8 líneas. Ve al dato.";
}
