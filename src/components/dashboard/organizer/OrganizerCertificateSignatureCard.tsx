"use client";

import { useState } from "react";
import { PenTool, Upload, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { saveOrganizerCertificateSignatureAction } from "@/actions/organizer/signature";
import {
  OrganizerCertificateSignatureCardProps,
  SignatureMode,
  SignatureHeader,
  SignatureTitleField,
  SignatureUploadSection,
  SignatureDrawCanvas,
  SignaturePreviewCard,
} from "./signature";

export function OrganizerCertificateSignatureCard({
  initialSignatureUrl,
  initialSignatureTitle,
  organizerName,
  organizationName,
  locale = "es",
}: OrganizerCertificateSignatureCardProps) {
  const [signatureMode, setSignatureMode] = useState<SignatureMode>("upload");
  const [signatureUrl, setSignatureUrl] = useState<string | null>(initialSignatureUrl || null);
  const [signatureTitle, setSignatureTitle] = useState<string>(
    initialSignatureTitle || "Organizador Responsable"
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveOrganizerCertificateSignatureAction({
        signatureUrl,
        signatureTitle,
      });
      toast.success(
        locale === "en"
          ? "Official signature and title saved successfully!"
          : "¡Firma oficial y cargo guardados exitosamente!"
      );
    } catch (err) {
      console.error("Error saving signature:", err);
      toast.error(
        locale === "en"
          ? "Failed to save signature settings"
          : "Error al guardar la configuración de firma"
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-6">
      <SignatureHeader locale={locale} />

      <SignatureTitleField
        signatureTitle={signatureTitle}
        setSignatureTitle={setSignatureTitle}
        locale={locale}
      />

      {/* Mode Selector */}
      <div className="space-y-3">
        <label className="text-xs font-semibold text-foreground block">
          {locale === "en"
            ? "Signature / Institutional Stamp Source"
            : "Origen de la Firma o Sello Institucional"}
        </label>
        <div className="flex rounded-xl bg-muted/60 p-1 border border-border gap-1 w-fit">
          <button
            type="button"
            onClick={() => setSignatureMode("upload")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
              signatureMode === "upload"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Upload className="h-3.5 w-3.5" />
            <span>
              {locale === "en"
                ? "Upload Image / Stamp (PNG/JPG)"
                : "Subir Imagen / Sello (PNG/JPG)"}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setSignatureMode("draw")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
              signatureMode === "draw"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <PenTool className="h-3.5 w-3.5" />
            <span>{locale === "en" ? "Draw Digital Signature" : "Dibujar Firma en Pantalla"}</span>
          </button>
        </div>
      </div>

      {signatureMode === "upload" ? (
        <SignatureUploadSection
          signatureUrl={signatureUrl}
          setSignatureUrl={setSignatureUrl}
          locale={locale}
        />
      ) : (
        <SignatureDrawCanvas setSignatureUrl={setSignatureUrl} locale={locale} />
      )}

      <SignaturePreviewCard
        signatureUrl={signatureUrl}
        signatureTitle={signatureTitle}
        organizerName={organizerName}
        organizationName={organizationName}
        locale={locale}
      />

      {/* Save Button */}
      <div className="pt-2 flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 text-sm font-bold shadow-md shadow-primary/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{locale === "en" ? "Saving..." : "Guardando cambios..."}</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" />
              <span>
                {locale === "en" ? "Save Official Signature" : "Guardar Firma Oficial"}
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
