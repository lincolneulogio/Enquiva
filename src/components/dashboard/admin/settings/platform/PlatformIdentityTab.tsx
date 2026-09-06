"use client";

import { useState, useTransition } from "react";
import { Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useLocale } from "@/components/providers/LocaleProvider";
import { saveSystemSettingsAction } from "@/actions/admin/settings";
import { useRouter } from "next/navigation";
import type { SystemSettings } from "@/lib/settings";

interface PlatformIdentityTabProps {
    initialPlatformSettings: SystemSettings;
}

export function PlatformIdentityTab({ initialPlatformSettings }: PlatformIdentityTabProps) {
    const { locale } = useLocale();
    const router = useRouter();
    const [isSaving, startSaving] = useTransition();

    const [platformOrgName, setPlatformOrgName] = useState(initialPlatformSettings.organizationName ?? "");
    const [platformSupportEmail, setPlatformSupportEmail] = useState(initialPlatformSettings.supportEmail ?? "");
    const [platformContactEmail, setPlatformContactEmail] = useState(initialPlatformSettings.publicContactEmail ?? "");
    const [platformLocation, setPlatformLocation] = useState(initialPlatformSettings.publicLocation ?? "");

    const [socialFacebook, setSocialFacebook] = useState(initialPlatformSettings.socialFacebook ?? "");
    const [socialInstagram, setSocialInstagram] = useState(initialPlatformSettings.socialInstagram ?? "");
    const [socialX, setSocialX] = useState(initialPlatformSettings.socialX ?? "");
    const [socialLinkedIn, setSocialLinkedIn] = useState(initialPlatformSettings.socialLinkedIn ?? "");
    const [socialYoutube, setSocialYoutube] = useState(initialPlatformSettings.socialYoutube ?? "");
    const [socialWhatsApp, setSocialWhatsApp] = useState(initialPlatformSettings.socialWhatsApp ?? "");

    const [termsUrl, setTermsUrl] = useState(initialPlatformSettings.termsUrl ?? "");
    const [privacyUrl, setPrivacyUrl] = useState(initialPlatformSettings.privacyUrl ?? "");

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
                    termsUrl: termsUrl.trim() || undefined,
                    privacyUrl: privacyUrl.trim() || undefined,
                });
                if (res.success) {
                    toast.success(
                        locale === "en"
                            ? "Platform identity, contact & legal URLs saved"
                            : "Identidad, contacto y URLs legales guardados"
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
                            className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">
                            {locale === "en" ? "Support email (operations)" : "Correo de soporte (operaciones)"}
                        </label>
                        <input
                            type="email"
                            value={platformSupportEmail}
                            onChange={(e) => setPlatformSupportEmail(e.target.value)}
                            className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                        />
                        <p className="text-[11px] text-muted-foreground">
                            {locale === "en"
                                ? "Used in welcome / system email footers."
                                : "Se usa en el pie de correos de bienvenida y del sistema."}
                        </p>
                    </div>
                </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-4 sm:p-6 space-y-4">
                <div>
                    <h2 className="text-lg font-semibold text-foreground">
                        {locale === "en" ? "Public contact & social" : "Contacto público y redes"}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {locale === "en"
                            ? "Shown on the public landing footer. Leave a social field empty to hide that network."
                            : "Se muestra en el footer de la landing pública. Deja vacío un campo social para ocultar esa red."}
                    </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">
                            {locale === "en" ? "Public contact email" : "Correo público de contacto"}
                        </label>
                        <input
                            type="email"
                            value={platformContactEmail}
                            onChange={(e) => setPlatformContactEmail(e.target.value)}
                            placeholder="hola@tu-dominio.com"
                            className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">
                            {locale === "en" ? "Location (optional)" : "Ubicación (opcional)"}
                        </label>
                        <input
                            type="text"
                            value={platformLocation}
                            onChange={(e) => setPlatformLocation(e.target.value)}
                            placeholder={locale === "en" ? "City, Country" : "Ciudad, País"}
                            className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                        />
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">Facebook</label>
                        <input
                            type="text"
                            value={socialFacebook}
                            onChange={(e) => setSocialFacebook(e.target.value)}
                            placeholder="https://facebook.com/tu-pagina"
                            className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">Instagram</label>
                        <input
                            type="text"
                            value={socialInstagram}
                            onChange={(e) => setSocialInstagram(e.target.value)}
                            placeholder="https://instagram.com/tu-cuenta"
                            className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">X (Twitter)</label>
                        <input
                            type="text"
                            value={socialX}
                            onChange={(e) => setSocialX(e.target.value)}
                            placeholder="https://x.com/tu-cuenta"
                            className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">LinkedIn</label>
                        <input
                            type="text"
                            value={socialLinkedIn}
                            onChange={(e) => setSocialLinkedIn(e.target.value)}
                            placeholder="https://linkedin.com/company/…"
                            className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">YouTube</label>
                        <input
                            type="text"
                            value={socialYoutube}
                            onChange={(e) => setSocialYoutube(e.target.value)}
                            placeholder="https://youtube.com/@tu-canal"
                            className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">WhatsApp</label>
                        <input
                            type="text"
                            value={socialWhatsApp}
                            onChange={(e) => setSocialWhatsApp(e.target.value)}
                            placeholder="+51999999999 o https://wa.me/51…"
                            className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                        />
                    </div>
                </div>

                <div className="pt-2 flex justify-end">
                    <button
                        type="button"
                        onClick={handleSavePlatformIdentity}
                        disabled={isSaving}
                        className="w-full sm:w-auto justify-center flex items-center gap-2 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-semibold px-4 py-2 text-xs transition duration-200 disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                        {locale === "en" ? "Save identity & contact" : "Guardar identidad y contacto"}
                    </button>
                </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-4 sm:p-6 space-y-4">
                <div>
                    <h2 className="text-lg font-semibold text-foreground">
                        {locale === "en" ? "Legal pages" : "Páginas legales"}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {locale === "en"
                            ? "Shown in the public footer and signup notice. Use a full URL or an internal path like /terms."
                            : "Aparecen en el footer público y en el aviso de registro. Usa una URL completa o una ruta interna como /terms."}
                    </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">
                            {locale === "en" ? "Terms of service URL" : "URL de términos de servicio"}
                        </label>
                        <input
                            type="text"
                            value={termsUrl}
                            onChange={(e) => setTermsUrl(e.target.value)}
                            placeholder="https://…/terms  o  /terms"
                            className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">
                            {locale === "en" ? "Privacy policy URL" : "URL de política de privacidad"}
                        </label>
                        <input
                            type="text"
                            value={privacyUrl}
                            onChange={(e) => setPrivacyUrl(e.target.value)}
                            placeholder="https://…/privacy  o  /privacy"
                            className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                        />
                    </div>
                </div>

                <div className="pt-1 flex justify-end">
                    <button
                        type="button"
                        onClick={handleSavePlatformIdentity}
                        disabled={isSaving}
                        className="w-full sm:w-auto justify-center flex items-center gap-2 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-semibold px-4 py-2 text-xs transition duration-200 disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                        {locale === "en" ? "Save legal URLs" : "Guardar URLs legales"}
                    </button>
                </div>
            </div>

            <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4 sm:p-5">
                <h3 className="text-sm font-semibold text-foreground">
                    {locale === "en" ? "Platform settings status" : "Estado de la configuración"}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                    {locale === "en"
                        ? "Identity, legal URLs, accent, locale & timezone, maintenance, SMTP, push branding, system alerts and DB backup are available."
                        : "Identidad, URLs legales, acento, idioma/zona horaria, mantenimiento, SMTP, marca push, alertas y backup BD están disponibles."}
                </p>
            </div>
        </div>
    );
}
