/**
 * Query rewrite: expande preguntas cortas a términos del dominio Enquiva
 * antes del retrieve (advanced RAG).
 */

const EXPANSIONS: Array<{ pattern: RegExp; terms: string }> = [
  {
    pattern: /\b(pago|pagar|cobro|checkout|culqi|yape|tarjeta)\b/i,
    terms: "pagos checkout Culqi Yape tarjeta inscripción pending approved",
  },
  {
    pattern: /\b(ticket|entrada|inscrip|registro|qr)\b/i,
    terms: "tickets inscripciones QR check-in membership registration",
  },
  {
    pattern: /\b(transporte|bus|ruta|asiento|paradero)\b/i,
    terms: "transporte rutas buses asientos bookings paraderos",
  },
  {
    pattern: /\b(check.?in|escanear|scanner|ingreso)\b/i,
    terms: "check-in scanner QR asistencia organizer scan",
  },
  {
    pattern: /\b(plan|billing|suscrip|licencia|membres[ií]a)\b/i,
    terms: "planes billing suscripción límites IA Culqi featureAi",
  },
  {
    pattern: /\b(notific|broadcast|comunicado|aviso)\b/i,
    terms: "comunicaciones broadcast notificaciones masivas",
  },
  {
    pattern: /\b(modulo|módulo|modulos|módulos)\b/i,
    terms: "inventario módulos Enquiva plataforma",
  },
  {
    pattern: /\b(contrase[nñ]a|login|registro|cuenta|auth)\b/i,
    terms: "autenticación cuentas login verify-account",
  },
];

export function rewriteQuery(raw: string): { original: string; rewritten: string } {
  const original = raw.trim();
  if (!original) return { original: "", rewritten: "enquiva módulos plataforma" };

  const extras: string[] = [];
  for (const rule of EXPANSIONS) {
    if (rule.pattern.test(original)) extras.push(rule.terms);
  }

  if (extras.length === 0) {
    return { original, rewritten: original };
  }

  const rewritten = `${original} ${[...new Set(extras.join(" ").split(/\s+/))].join(" ")}`;
  return { original, rewritten };
}
