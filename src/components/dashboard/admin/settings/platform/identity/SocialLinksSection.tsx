"use client";

import { Save, Loader2 } from "lucide-react";

interface SocialLinksSectionProps {
  locale: "es" | "en";
  socialFacebook: string;
  setSocialFacebook: (val: string) => void;
  socialInstagram: string;
  setSocialInstagram: (val: string) => void;
  socialX: string;
  setSocialX: (val: string) => void;
  socialLinkedIn: string;
  setSocialLinkedIn: (val: string) => void;
  socialYoutube: string;
  setSocialYoutube: (val: string) => void;
  socialWhatsApp: string;
  setSocialWhatsApp: (val: string) => void;
  isSaving: boolean;
  onSave: () => void;
}

export function SocialLinksSection({
  locale,
  socialFacebook,
  setSocialFacebook,
  socialInstagram,
  setSocialInstagram,
  socialX,
  setSocialX,
  socialLinkedIn,
  setSocialLinkedIn,
  socialYoutube,
  setSocialYoutube,
  socialWhatsApp,
  setSocialWhatsApp,
  isSaving,
  onSave,
}: SocialLinksSectionProps) {
  return (
    <>
      <div className="pt-2 border-t border-border">
        <h3 className="text-sm font-semibold text-foreground">
          {locale === "en" ? "Social networks" : "Redes sociales"}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {locale === "en"
            ? "Official channels shown in public footers and communications."
            : "Canales oficiales mostrados en footers públicos y comunicaciones."}
        </p>
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
          onClick={onSave}
          disabled={isSaving}
          className="w-full sm:w-auto justify-center flex items-center gap-2 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-semibold px-4 py-2 text-xs transition duration-200 disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          {locale === "en" ? "Save identity & contact" : "Guardar identidad y contacto"}
        </button>
      </div>
    </>
  );
}
