"use client";

import { Save, Loader2 } from "lucide-react";

interface LegalPagesSectionProps {
  locale: "es" | "en";
  termsUrl: string;
  setTermsUrl: (val: string) => void;
  privacyUrl: string;
  setPrivacyUrl: (val: string) => void;
  isSaving: boolean;
  onSave: () => void;
}

export function LegalPagesSection({
  locale,
  termsUrl,
  setTermsUrl,
  privacyUrl,
  setPrivacyUrl,
  isSaving,
  onSave,
}: LegalPagesSectionProps) {
  return (
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
          onClick={onSave}
          disabled={isSaving}
          className="w-full sm:w-auto justify-center flex items-center gap-2 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-semibold px-4 py-2 text-xs transition duration-200 disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          {locale === "en" ? "Save legal URLs" : "Guardar URLs legales"}
        </button>
      </div>
    </div>
  );
}
