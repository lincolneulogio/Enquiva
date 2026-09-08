"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useLocale } from "@/components/providers/LocaleProvider";
import { saveSystemSettingsAction } from "@/actions/admin/settings";
import { useRouter } from "next/navigation";
import type { SystemSettings } from "@/lib/settings";
import { SocialLinksSection } from "./identity";

export interface PlatformIdentityTabProps {
  initialPlatformSettings: SystemSettings;
  /** Correo del canal "Eventos empresariales" (Contactos). Solo lectura: settings no tiene casilla propia. */
  corporateEmail?: string;
}

export function PlatformIdentityTab({ initialPlatformSettings, corporateEmail = "" }: PlatformIdentityTabProps) {
  const { locale } = useLocale();
  const router = useRouter();
  const [isSaving, startSaving] = useTransition();

  const [platformOrgName, setPlatformOrgName] = useState(initialPlatformSettings.organizationName ?? "");
  const [platformSupportEmail] = useState(initialPlatformSettings.supportEmail ?? "");
  const [platformContactEmail] = useState(initialPlatformSettings.publicContactEmail ?? "");
  const [platformLocation] = useState(initialPlatformSettings.publicLocation ?? "");

  const [socialFacebook, setSocialFacebook] = useState(initialPlatformSettings.socialFacebook ?? "");
  const [socialInstagram, setSocialInstagram] = useState(initialPlatformSettings.socialInstagram ?? "");
  const [socialX, setSocialX] = useState(initialPlatformSettings.socialX ?? "");
  const [socialLinkedIn, setSocialLinkedIn] = useState(initialPlatformSettings.socialLinkedIn ?? "");
  const [socialYoutube, setSocialYoutube] = useState(initialPlatformSettings.socialYoutube ?? "");
  const [socialWhatsApp, setSocialWhatsApp] = useState(initialPlatformSettings.socialWhatsApp ?? "");

  const handleSavePlatformIdentity = () => {
    if (!platformOrgName.trim()) {
      toast.error(locale === "en" ? "Platform name cannot be empty" : "El nombre de la plataforma no puede estar vacío");
      return;
    }
    if (!platformSupportEmail.trim() || !platformSupportEmail.includes("@")) {
      toast.error(locale === "en" ? "Please enter a valid support email" : "Por favor, ingresa un correo de soporte válido");
      return;
    }
    if (!platformContactEmail.trim() || !platformContactEmail.includes("@")) {
      toast.error(locale === "en" ? "Please enter a valid public contact email" : "Ingresa un correo público de contacto válido");
      return;
    }

    startSaving(async () => {
      try {
        const res = await saveSystemSettingsAction({
          organizationName: platformOrgName.trim(),
          supportEmail: platformSupportEmail.trim(),
          publicContactEmail: platformContactEmail.trim(),
          publicLocation: platformLocation.trim() || undefined,
          socialFacebook: socialFacebook.trim() || undefined,
          socialInstagram: socialInstagram.trim() || undefined,
          socialX: socialX.trim() || undefined,
          socialLinkedIn: socialLinkedIn.trim() || undefined,
          socialWhatsApp: socialWhatsApp.trim() || undefined,
          socialYoutube: socialYoutube.trim() || undefined,
        });
        if (res.success) {
          toast.success(
            locale === "en"
              ? "Platform identity and contact saved"
              : "Identidad y contacto guardados"
          );
          router.refresh();
        } else {
          toast.error(locale === "en" ? "Error saving identity" : "Error al guardar identidad");
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Error";
        toast.error(message);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-4 sm:p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            {locale === "en" ? "Global platform identity" : "Identidad global de la plataforma"}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {locale === "en"
              ? "Brand name and operational support email (system emails, tickets, sidebar)."
              : "Nombre de marca y correo operativo de soporte (correos del sistema, tickets, sidebar)."}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {locale === "en"
              ? "Support, contact and business emails plus public location are managed in Marketing & Portal → Contact and shown here read-only."
              : "Los correos de soporte, contacto y empresarial más la ubicación pública se gestionan en Marketing & Portada → Contacto y aquí se muestran solo como lectura."}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              {locale === "en" ? "Platform / brand name" : "Nombre de la plataforma / marca"}
            </label>
            <input
              type="text"
              value={platformOrgName}
              onChange={(e) => setPlatformOrgName(e.target.value)}
              placeholder="Enquiva"
              className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              {locale === "en" ? "Support email" : "Correo de soporte"}
            </label>
            <input
              type="email"
              value={platformSupportEmail}
              disabled
              readOnly
              title={locale === "en" ? "Managed in Marketing & Portal → Contact" : "Se gestiona en Marketing & Portada → Contacto"}
              placeholder="soporte@tu-dominio.com"
              className="w-full rounded-lg border border-border bg-muted/40 px-3.5 py-2 text-sm text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-80"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              {locale === "en" ? "Public contact email" : "Correo público de contacto"}
            </label>
            <input
              type="email"
              value={platformContactEmail}
              disabled
              readOnly
              title={locale === "en" ? "Managed in Marketing & Portal → Contact" : "Se gestiona en Marketing & Portada → Contacto"}
              placeholder="contacto@tu-dominio.com"
              className="w-full rounded-lg border border-border bg-muted/40 px-3.5 py-2 text-sm text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-80"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              {locale === "en" ? "Business email (corporate events)" : "Correo empresarial (eventos)"}
            </label>
            <input
              type="email"
              value={corporateEmail}
              disabled
              readOnly
              title={locale === "en" ? "Managed in Marketing & Portal → Contact" : "Se gestiona en Marketing & Portada → Contacto"}
              placeholder="empresas@tu-dominio.com"
              className="w-full rounded-lg border border-border bg-muted/40 px-3.5 py-2 text-sm text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-80"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-semibold text-foreground">
              {locale === "en" ? "Public location" : "Ubicación pública"}
            </label>
            <textarea
              rows={2}
              value={platformLocation}
              disabled
              readOnly
              title={locale === "en" ? "Managed in Marketing & Portal → Contact (headquarters)" : "Se gestiona en Marketing & Portada → Contacto (sede central)"}
              placeholder={locale === "en" ? "Lima, Peru" : "Lima, Perú"}
              className="w-full resize-none rounded-lg border border-border bg-muted/40 px-3.5 py-2 text-sm leading-relaxed text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-80"
            />
          </div>
        </div>

        <SocialLinksSection
          locale={locale}
          socialFacebook={socialFacebook}
          setSocialFacebook={setSocialFacebook}
          socialInstagram={socialInstagram}
          setSocialInstagram={setSocialInstagram}
          socialX={socialX}
          setSocialX={setSocialX}
          socialLinkedIn={socialLinkedIn}
          setSocialLinkedIn={setSocialLinkedIn}
          socialYoutube={socialYoutube}
          setSocialYoutube={setSocialYoutube}
          socialWhatsApp={socialWhatsApp}
          setSocialWhatsApp={setSocialWhatsApp}
          isSaving={isSaving}
          onSave={handleSavePlatformIdentity}
        />
      </div>

      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4 sm:p-5">
        <h3 className="text-sm font-semibold text-foreground">
          {locale === "en" ? "Platform settings status" : "Estado de la configuración"}
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          {locale === "en"
            ? "Identity, accent, locale & timezone, maintenance, SMTP, push branding, system alerts and DB backup are available."
            : "Identidad, acento, idioma/zona horaria, mantenimiento, SMTP, marca push, alertas y backup BD están disponibles."}
        </p>
      </div>
    </div>
  );
}
