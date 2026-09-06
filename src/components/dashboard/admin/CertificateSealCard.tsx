"use client";

import { useState, useRef, useTransition } from "react";
import Image from "next/image";
import { toast } from "sonner";
import {
  Award,
  Upload,
  CheckCircle2,
  Trash2,
  Loader2,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  QrCode,
  FileCheck,
} from "lucide-react";
import { useUploadThing } from "@/lib/uploadthing/components";
import { deleteOrphanUploadAction } from "@/actions/admin/upload-cleanup";
import {
  saveCertificateSealAction,
  resetCertificateSealAction,
} from "@/actions/admin/certificate-seal";
import { DEFAULT_CERTIFICATE_SEAL_URL } from "@/lib/certificates/constants";

interface CertificateSealCardProps {
  initialSealUrl?: string | null;
  locale?: "es" | "en";
}

export function CertificateSealCard({
  initialSealUrl,
  locale = "es",
}: CertificateSealCardProps) {
  const isEn = locale === "en";
  const [sealUrl, setSealUrl] = useState<string>(
    initialSealUrl || DEFAULT_CERTIFICATE_SEAL_URL
  );
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isCustomSeal =
    Boolean(sealUrl) && sealUrl !== DEFAULT_CERTIFICATE_SEAL_URL;

  const { startUpload, isUploading } = useUploadThing("certificateSealImage", {
    onUploadProgress: (p) => {
      setUploadProgress(p);
    },
    onClientUploadComplete: (res) => {
      const newUrl = res?.[0]?.url;
      if (newUrl) {
        // Limpiar archivo anterior si era huérfano o de uploadthing
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
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
              <Award className="h-3.5 w-3.5" />
              <span>
                {isEn
                  ? "Accreditation & Digital Credentials"
                  : "Acreditación y Credenciales Oficiales"}
              </span>
            </div>
            <h3 className="text-xl font-bold tracking-tight text-foreground">
              {isEn
                ? "Official Certificate Seal (Enquiva Verified)"
                : "Sello Oficial de Certificados (Enquiva Verified)"}
            </h3>
            <p className="text-xs text-muted-foreground max-w-2xl">
              {isEn
                ? "Upload the official seal image displayed in the center of all participation and achievement certificates generated across the platform."
                : "Configura el sello holográfico digital que se ubica en el centro de todos los diplomas y certificados de participación emitidos para los asistentes de la plataforma."}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isCustomSeal ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {isEn ? "Custom Seal Active" : "Sello Personalizado"}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary border border-primary/20">
                <ShieldCheck className="h-3.5 w-3.5" />
                {isEn ? "Default Official Seal" : "Sello Enquiva Oficial"}
              </span>
            )}
          </div>
        </div>

        {/* Sección de Carga y Visualización */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Columna Izquierda: Vista Previa del Sello Circular */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center p-6 rounded-2xl border border-border/80 bg-muted/20 text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
              {isEn ? "Seal Preview" : "Vista Previa del Sello"}
            </p>

            <div className="relative h-44 w-44 rounded-full border-4 border-amber-500/40 bg-white p-2 shadow-xl shadow-amber-500/10 flex items-center justify-center overflow-hidden">
              {sealUrl ? (
                <Image
                  src={sealUrl}
                  alt="Enquiva Verified Seal"
                  width={160}
                  height={160}
                  className="h-full w-full object-contain rounded-full"
                  priority
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-muted-foreground">
                  <Award className="h-12 w-12 text-amber-500" />
                  <span className="text-xs font-semibold mt-1">Sin sello</span>
                </div>
              )}
            </div>

            <p className="mt-4 text-xs font-semibold text-foreground">
              {isCustomSeal
                ? isEn
                  ? "Custom cryptographic seal"
                  : "Sello criptográfico personalizado"
                : isEn
                  ? "Standard official Enquiva Verified seal"
                  : "Sello oficial Enquiva Verified"}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {isEn ? "Format: Transparent PNG / JPG" : "Formato óptimo: PNG con fondo transparente"}
            </p>
          </div>

          {/* Columna Derecha: Zona de Subida y Controles */}
          <div className="lg:col-span-8 space-y-5">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files)}
            />

            {/* Drag and Drop Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                handleFileSelect(e.dataTransfer.files);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-all ${
                isDragging
                  ? "border-primary bg-primary/5 scale-[0.99]"
                  : "border-border/80 hover:border-primary/60 hover:bg-muted/30"
              }`}
            >
              {isUploading ? (
                <div className="flex flex-col items-center gap-3 py-4">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <p className="text-sm font-semibold text-foreground">
                    {isEn ? "Uploading seal..." : "Subiendo archivo del sello..."}{" "}
                    {uploadProgress > 0 && `${uploadProgress}%`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isEn ? "Processing security image" : "Procesando en CDN segura"}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 py-2">
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-xs">
                    <Upload className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">
                      {isEn
                        ? "Click to choose an image or drag & drop"
                        : "Haz clic para seleccionar o arrastra una imagen aquí"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PNG (recomendado con transparencia), JPG o WEBP • Máximo 4MB
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Barra de Acciones */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                {isCustomSeal && (
                  <button
                    type="button"
                    onClick={handleResetToDefault}
                    disabled={isPending || isUploading}
                    className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>
                      {isEn ? "Restore Enquiva Default Seal" : "Restablecer sello original"}
                    </span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isPending || isUploading}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-xs font-bold text-primary-foreground shadow-md shadow-primary/25 hover:bg-primary/95 transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>{isEn ? "Saving..." : "Guardando..."}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>{isEn ? "Save Global Seal" : "Guardar Sello Oficial"}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Simulación en Vivo: Cómo luce en el Certificado Oficial */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-4 w-4 text-amber-500" />
          <h4 className="text-sm font-bold text-foreground">
            {isEn ? "Live Placement on Official Certificate" : "Ubicación en el Certificado Oficial"}
          </h4>
        </div>
        <p className="text-xs text-muted-foreground mb-6">
          {isEn
            ? "Here is how the seal sits in relation to the organizer signature and the anti-fraud QR validation."
            : "Así se visualiza el sello en el pie del documento, equilibrado entre la firma de la autoridad organizadora y el código QR de verificación anti-fraude."}
        </p>

        {/* Mockup en miniatura del pie del certificado */}
        <div className="rounded-2xl border border-border/80 bg-slate-50 dark:bg-slate-950/60 p-6 sm:p-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center text-center">
            {/* Lado Izquierdo: Firma del Organizador */}
            <div className="flex flex-col items-center">
              <div className="h-10 border-b border-slate-400 dark:border-slate-600 w-36 flex items-end justify-center pb-1">
                <span className="font-serif italic text-xs text-slate-700 dark:text-slate-300">
                  Firma Digital Verificada
                </span>
              </div>
              <p className="text-[11px] font-bold text-foreground mt-2">Organizador Demo</p>
              <p className="text-[10px] text-muted-foreground">Firma y Sello de Autoridad</p>
            </div>

            {/* Centro: Sello Oficial Dinámico */}
            <div className="flex flex-col items-center">
              <div className="relative h-20 w-20 rounded-full border-2 border-amber-500/50 bg-white p-1 shadow-md shadow-amber-500/10 flex items-center justify-center overflow-hidden">
                {sealUrl ? (
                  <Image
                    src={sealUrl}
                    alt="Sello Dinámico"
                    width={72}
                    height={72}
                    className="h-full w-full object-contain rounded-full"
                  />
                ) : (
                  <Award className="h-8 w-8 text-amber-600" />
                )}
              </div>
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 mt-2 uppercase tracking-wider">
                Sello Oficial
              </span>
            </div>

            {/* Lado Derecho: Código QR Anti-fraude */}
            <div className="flex flex-col items-center">
              <div className="p-2 rounded-xl bg-white border border-border shadow-xs">
                <QrCode className="h-12 w-12 text-slate-900" />
              </div>
              <span className="text-[10px] font-bold text-foreground mt-2">
                ENQ-2026-CERT-BKLXLK
              </span>
              <p className="text-[9px] text-muted-foreground">Escanea para verificar</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
