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
import { useTranslations } from "@/components/providers/LocaleProvider";
import type { CertificateSealCardProps } from "./types";
import {
  SealCardHeader,
  SealPreviewCircle,
  SealUploadZone,
  SealCertificateSimulation,
} from "./index";

export function CertificateSealCard({
  initialSealUrl,
  locale = "es",
}: CertificateSealCardProps) {
  const t = useTranslations();
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
          toast.success(t("dashboard.admin.sealSaved"));
        } else {
          toast.error(res.error || t("dashboard.admin.sealSaveError"));
        }
      } catch {
        toast.error(t("dashboard.admin.sealSaveUnexpectedError"));
      }
    });
  };

  const handleResetToDefault = () => {
    startTransition(async () => {
      try {
        const res = await resetCertificateSealAction();
        if (res.success && res.sealUrl) {
          setSealUrl(res.sealUrl);
          toast.success(t("dashboard.admin.sealResetSuccess"));
        } else {
          toast.error(res.error || t("dashboard.admin.sealResetError"));
        }
      } catch {
        toast.error(t("dashboard.admin.sealResetUnexpectedError"));
      }
    });
  };

  return (
    <div className="space-y-6">
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
