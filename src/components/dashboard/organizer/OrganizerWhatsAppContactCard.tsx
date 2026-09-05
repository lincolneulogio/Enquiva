"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { MessageCircle, ExternalLink, Save, Loader2, Phone } from "lucide-react";
import { saveOrganizerContactAction } from "@/actions/organizer/contact";
import { buildWhatsAppChatUrl } from "@/lib/share/whatsapp";

interface OrganizerWhatsAppContactCardProps {
  initialWhatsapp: string | null;
  organizerName: string;
  locale?: string;
}

export function OrganizerWhatsAppContactCard({
  initialWhatsapp,
  organizerName,
  locale = "es",
}: OrganizerWhatsAppContactCardProps) {
  const [whatsapp, setWhatsapp] = useState(initialWhatsapp ?? "");
  const [isPending, startTransition] = useTransition();

  const previewWa = whatsapp.trim()
    ? buildWhatsAppChatUrl({
        phone: whatsapp.trim(),
        text:
          locale === "en"
            ? `Hello! I'm contacting you regarding your events organized by ${organizerName}.`
            : `¡Hola! Me comunico respecto a tus eventos en Enquiva organizados por ${organizerName}.`,
      })
    : null;

  const handleSave = () => {
    startTransition(async () => {
      try {
        await saveOrganizerContactAction(whatsapp.trim() || null);
        toast.success(
          locale === "en"
            ? "WhatsApp contact updated successfully"
            : "Número de WhatsApp de contacto guardado con éxito"
        );
      } catch (err) {
        toast.error(
          err instanceof Error
            ? err.message
            : locale === "en"
            ? "Could not update WhatsApp"
            : "No se pudo actualizar el número de WhatsApp"
        );
      }
    });
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <MessageCircle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-base">
              {locale === "en" ? "WhatsApp Contact" : "Contacto Directo por WhatsApp"}
            </h3>
            <p className="text-xs text-muted-foreground">
              {locale === "en"
                ? "Attendees can click 'Contact organizer' on your event pages to chat with you directly."
                : "Los asistentes podrán hacer clic en 'Contactar organizador' en tus eventos para comunicarse contigo directamente."}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-semibold text-foreground">
          {locale === "en" ? "WhatsApp Number (with country code)" : "Número de WhatsApp (con código de país o nacional)"}
        </label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
            <Phone className="h-4 w-4" />
          </div>
          <input
            type="tel"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="+51 987 654 321 o 987654321"
            className="w-full rounded-lg border border-border bg-background pl-9 pr-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          {previewWa ? (
            <a
              href={previewWa}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>
                {locale === "en" ? "Test WhatsApp chat link" : "Probar enlace de chat WhatsApp"}
              </span>
            </a>
          ) : (
            <p className="text-[11px] text-muted-foreground">
              {locale === "en"
                ? "Enter your number to enable the direct contact button on your events."
                : "Ingresa tu número para habilitar el botón de contacto en la página pública de tus eventos."}
            </p>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/95 transition-colors disabled:opacity-50 ml-auto"
          >
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            <span>{locale === "en" ? "Save WhatsApp" : "Guardar WhatsApp"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
