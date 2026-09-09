"use client";

import { useRef } from "react";
import { Upload, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useCloudinaryUpload } from "@/lib/cloudinary/components";
import { deleteOrganizerUploadAction } from "@/actions/admin/upload-cleanup";

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
  const inputRef = useRef<HTMLInputElement>(null);

  const { startUpload, isUploading } = useCloudinaryUpload("signature", {
    onClientUploadComplete: (res) => {
      const url = res?.[0]?.url;
      if (!url) return;
      if (signatureUrl && signatureUrl.includes("res.cloudinary.com")) {
        deleteOrganizerUploadAction(signatureUrl).catch(() => {});
      }
      setSignatureUrl(url);
      toast.success(
        locale === "en" ? "Signature loaded into preview" : "Firma cargada en la vista previa"
      );
    },
    onUploadError: (err) => {
      toast.error(
        locale === "en"
          ? `Failed to upload signature: ${err.message}`
          : `Error al subir la firma: ${err.message}`
      );
    },
  });

  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0 || isUploading) return;
    const file = files[0];

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

    startUpload([file]);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-5 text-center">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
        {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
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
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => handleFileUpload(e.target.files)}
            className="sr-only"
            disabled={isUploading}
          />
        </label>
        {signatureUrl && (
          <button
            type="button"
            onClick={() => setSignatureUrl(null)}
            className="rounded-xl border border-destructive/30 bg-destructive/5 hover:bg-destructive/10 text-destructive px-3 py-2 text-xs font-semibold transition"
            title={locale === "en" ? "Remove signature" : "Eliminar firma"}
            disabled={isUploading}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}