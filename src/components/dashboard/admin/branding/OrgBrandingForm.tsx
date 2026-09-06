"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { updateOrganizationBranding } from "@/actions/organizations/branding";
import { buildWhatsAppChatUrl } from "@/lib/share/whatsapp";

export interface OrgBrandingFormProps {
  initial: {
    logoUrl: string | null;
    accentColor: string | null;
    brandingEnabled: boolean;
    whatsappNumber: string | null;
    organizationName: string;
  };
  canUseBranding: boolean;
  locale?: "es" | "en";
}

export function OrgBrandingForm({
  initial,
  canUseBranding,
  locale = "es",
}: OrgBrandingFormProps) {
  const isEn = locale === "en";
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [logoUrl, setLogoUrl] = useState(initial.logoUrl ?? "");
  const [accentColor, setAccentColor] = useState(initial.accentColor ?? "#0f766e");
  const [brandingEnabled, setBrandingEnabled] = useState(initial.brandingEnabled);
  const [whatsappNumber, setWhatsappNumber] = useState(initial.whatsappNumber ?? "");

  const previewWa = buildWhatsAppChatUrl({
    phone: whatsappNumber,
    text: isEn
      ? `Hello! I'm interested in ${initial.organizationName} events.`
      : `¡Hola! Me interesa un evento de ${initial.organizationName}.`,
  });

  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-6 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          {isEn ? "Organization branding & WhatsApp" : "Branding de organización y WhatsApp"}
        </h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {canUseBranding
            ? isEn
              ? "Logo and accent apply on public event pages when enabled (Pro/Enterprise)."
              : "Logo y color de acento se aplican en páginas públicas de eventos al activarlo (Pro/Enterprise)."
            : isEn
              ? "Custom branding requires Pro or Enterprise. WhatsApp number is available on all plans."
              : "El branding personalizado requiere Pro o Enterprise. El WhatsApp está disponible en todos los planes."}
        </p>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={brandingEnabled}
          disabled={!canUseBranding}
          onChange={(e) => setBrandingEnabled(e.target.checked)}
          className="h-4 w-4 rounded border-border"
        />
        {isEn ? "Enable custom branding on public pages" : "Activar branding en páginas públicas"}
      </label>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-foreground">Logo URL</label>
        <input
          type="url"
          value={logoUrl}
          disabled={!canUseBranding}
          onChange={(e) => setLogoUrl(e.target.value)}
          placeholder="https://…"
          className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm disabled:opacity-60"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-foreground">
          {isEn ? "Accent color" : "Color de acento"}
        </label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={accentColor.startsWith("#") ? accentColor : "#0f766e"}
            disabled={!canUseBranding}
            onChange={(e) => setAccentColor(e.target.value)}
            className="h-10 w-14 cursor-pointer rounded border border-border bg-background disabled:opacity-60"
          />
          <input
            type="text"
            value={accentColor}
            disabled={!canUseBranding}
            onChange={(e) => setAccentColor(e.target.value)}
            className="flex-1 rounded-lg border border-border bg-background px-3.5 py-2 font-mono text-sm disabled:opacity-60"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-foreground">WhatsApp</label>
        <input
          type="tel"
          value={whatsappNumber}
          onChange={(e) => setWhatsappNumber(e.target.value)}
          placeholder="91987654321 o +51 987 654 321"
          className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm"
        />
        {whatsappNumber ? (
          <a
            href={previewWa}
            target="_blank"
            rel="noreferrer"
            className="inline-block text-xs font-medium text-primary hover:underline"
          >
            {isEn ? "Preview WhatsApp chat link" : "Probar enlace de chat WhatsApp"}
          </a>
        ) : null}
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            startTransition(async () => {
              try {
                await updateOrganizationBranding({
                  logoUrl,
                  accentColor,
                  brandingEnabled,
                  whatsappNumber,
                });
                toast.success(isEn ? "Organization branding saved" : "Branding guardado");
                router.refresh();
              } catch (error) {
                toast.error(
                  error instanceof Error
                    ? error.message
                    : isEn
                      ? "Could not save"
                      : "No se pudo guardar",
                );
              }
            });
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/95 disabled:opacity-50"
        >
          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          {isEn ? "Save branding" : "Guardar branding"}
        </button>
      </div>
    </div>
  );
}
