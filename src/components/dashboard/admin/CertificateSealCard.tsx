"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useUploadThing } from "@/lib/uploadthing/components";
import { deleteOrphanUploadAction } from "@/actions/admin/upload-cleanup";
import {
  saveCertificateSealAction,
  resetCertificateSealAction,
} from "@/actions/admin/certificate-seal";
import { DEFAULT_CERTIFICATE_SEAL_URL } from "@/lib/certificates/constants";
import {
  CertificateSealCardProps,
  SealCardHeader,
  SealPreviewCircle,
  SealUploadZone,
  SealCertificateSimulation,
} from "./seal";

export type { CertificateSealCardProps };

export function CertificateSealCard({
  initialSealUrl,
  locale = "es",
}: CertificateSealCardProps) {
  const isEn = locale === "en";
  const [sealUrl, setSealUrl] = useState<string>(
    initialSealUrl || DEFAULT_CERTIFICATE_SEAL_URL
  );
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isPending, startTransition] = useTransition();

  const isCustomSeal =
    Boolean(sealUrl) && sealUrl !== DEFAULT_CERTIFICATE_SEAL_URL;

  const { startUpload, isUploading } = useUploadThing("certificateSealImage", {
    onUploadProgress: (p) => {
      setUploadProgress(p);
    },
    onClientUploadComplete: (res) => {
      const newUrl = res?.[0]?.url;
      if (newUrl) {
        if (
          sealUrl &&
          sealUrl !== DEFAULT_CERTIFICATE_SEAL_URL &&
          (sealUrl.includes("uploadthing") || sealUrl.includes("utfs.io"))
        ) {
          deleteOrphanUploadAction(sealUrl).catch(() => {});
        }
        setSealUrl(newUrl);
        toast.success(
          isEn
            ? "Certificate seal uploaded! Click 'Save Changes' to apply."
            : "¡Sello subido con éxito! Haz clic en 'Guardar Cambios' para aplicar."
        );
      }
      setUploadProgress(0);
    },
    onUploadError: (err) => {
      setUploadProgress(0);
      toast.error(
        isEn
          ? `Upload error: ${err.message}`
          : `Error al subir imagen del sello: ${err.message}`
      );
    },
  });

  const handleFileSelect = async (files: FileList | File[] | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith("image/")) {
      toast.error(
        isEn
          ? "Please select a valid image file (PNG, JPG, WEBP, SVG)"
          : "Por favor selecciona un archivo de imagen válido (PNG, JPG, WEBP, SVG)"
      );
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      toast.error(
        isEn ? "The image exceeds 4MB" : "La imagen supera el límite de 4MB"
      );
      return;
    }
    await startUpload([file]);
  };

  const handleSave = () => {
    startTransition(async () => {
      try {
        const res = await saveCertificateSealAction(sealUrl);
        if (res.success) {
          toast.success(
            isEn
              ? "Certificate seal updated globally for all issued diplomas!"
              : "¡Sello oficial actualizado en todos los certificados de la plataforma!"
          );
        } else {
          toast.error(res.error || "No se pudo guardar el sello.");
        }
      } catch {
        toast.error("Ocurrió un error inesperado al guardar el sello.");
      }
    });
  };

  const handleResetToDefault = () => {
    startTransition(async () => {
      try {
        const res = await resetCertificateSealAction();
        if (res.success && res.sealUrl) {
          setSealUrl(res.sealUrl);
          toast.success(
            isEn
              ? "Reset to Enquiva default official seal."
              : "Se restableció el sello predeterminado oficial de Enquiva."
          );
        } else {
          toast.error(res.error || "Error al restablecer el sello.");
        }
      } catch {
        toast.error("Ocurrió un error al restablecer el sello.");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Tarjeta Principal de Configuración */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
        <SealCardHeader isCustomSeal={isCustomSeal} isEn={isEn} />

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <SealPreviewCircle
            sealUrl={sealUrl}
            isCustomSeal={isCustomSeal}
            isEn={isEn}
          />

          <SealUploadZone
            isUploading={isUploading}
            uploadProgress={uploadProgress}
            isPending={isPending}
            isCustomSeal={isCustomSeal}
            isEn={isEn}
            onFileSelect={handleFileSelect}
            onResetToDefault={handleResetToDefault}
            onSave={handleSave}
          />
        </div>
      </div>

      <SealCertificateSimulation sealUrl={sealUrl} isEn={isEn} />
    </div>
  );
}
