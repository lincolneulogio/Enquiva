"use client";

import { buildWhatsAppChatUrl, buildEventBroadcastWhatsAppText } from "@/lib/share/whatsapp";
import { MessageCircle } from "lucide-react";

export function WhatsAppBroadcastHint({
  eventTitle,
  message,
  eventUrl,
  orgWhatsApp,
  locale = "es",
}: {
  eventTitle: string;
  message: string;
  eventUrl?: string | null;
  orgWhatsApp?: string | null;
  locale?: "es" | "en";
}) {
  const text = buildEventBroadcastWhatsAppText({
    eventTitle,
    message: message || (locale === "en" ? "(Your message)" : "(Tu mensaje)"),
    eventUrl,
    locale,
  });
  const href = buildWhatsAppChatUrl({ phone: orgWhatsApp, text });

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-500/20 dark:text-emerald-200"
    >
      <MessageCircle className="h-3.5 w-3.5" />
      {locale === "en" ? "Open WhatsApp with draft" : "Abrir WhatsApp con borrador"}
    </a>
  );
}
