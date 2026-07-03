const METHOD_LABELS: Record<string, { es: string; en: string }> = {
  yape: { es: "Yape", en: "Yape" },
  plin: { es: "Plin", en: "Plin" },
  cash: { es: "Efectivo", en: "Cash" },
  culqi: { es: "Tarjeta (Culqi)", en: "Card (Culqi)" },
  manual: { es: "Pendiente", en: "Pending" },
};

export function getPaymentMethodLabel(method: string | null | undefined, locale = "es") {
  if (!method) return "—";
  const entry = METHOD_LABELS[method.toLowerCase()];
  if (!entry) return method;
  return locale === "en" ? entry.en : entry.es;
}
