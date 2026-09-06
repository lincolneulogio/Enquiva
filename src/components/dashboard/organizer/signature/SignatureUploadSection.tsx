"use client";

import { Upload, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface SignatureUploadSectionProps {
  signatureUrl: string | null;
  setSignatureUrl: (url: string | null) => void;
  locale: "es" | "en";
}

export function SignatureUploadSection({
  signatureUrl,
  setSignatureUrl,
  locale,
}: SignatureUploadSectionProps) {
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error(
        locale === "en" ? "Please select a valid image" : "Selecciona un archivo de imagen válido"
      );
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error(
        locale === "en" ? "Image must be under 2MB" : "La imagen debe pesar menos de 2MB"
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result);
      setSignatureUrl(result);
      toast.success(
        locale === "en" ? "Signature loaded into preview" : "Firma cargada en la vista previa"
      );
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-5 text-center">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Upload className="h-5 w-5" />
      </div>
      <p className="mt-2 text-xs font-semibold text-foreground">
        {locale === "en" ? "Select signature file" : "Selecciona tu firma escaneada o sello"}
      </p>
      <p className="text-[11px] text-muted-foreground mt-0.5">
        {locale === "en"
          ? "PNG with transparent background recommended (Max 2MB)"
          : "Recomendado archivo PNG con fondo transparente (Máx. 2MB)"}
      </p>
      <div className="mt-4 flex items-center justify-center gap-2">
        <label className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 text-xs font-bold transition cursor-pointer shadow-xs">
          <span>{locale === "en" ? "Browse Files" : "Explorar Archivos"}</span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleFileUpload}
            className="sr-only"
          />
        </label>
        {signatureUrl && (
          <button
            type="button"
            onClick={() => setSignatureUrl(null)}
            className="rounded-xl border border-destructive/30 bg-destructive/5 hover:bg-destructive/10 text-destructive px-3 py-2 text-xs font-semibold transition"
            title={locale === "en" ? "Remove signature" : "Eliminar firma"}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
