"use client";

import { useRef, useState } from "react";
import { useUploadThing } from "@/lib/uploadthing/components";
import { toast } from "sonner";
import {
  Camera,
  Upload,
  Trash2,
  Link2,
  Loader2,
  Check,
  AlertCircle,
  X,
} from "lucide-react";
import { useLocale, useTranslations } from "@/components/providers/LocaleProvider";
import { optimizeAvatarFiles } from "./avatar-utils";
import { cn } from "@/lib/utils";

interface AvatarUploadCardProps {
  previewImage: string | null;
  onUploadSuccess: (url: string) => void;
  onRemove: () => void;
  onChangeUrl?: (url: string) => void;
  error?: string;
}

export function AvatarUploadCard({
  previewImage,
  onUploadSuccess,
  onRemove,
  onChangeUrl,
  error,
}: AvatarUploadCardProps) {
  const t = useTranslations();
  const { locale } = useLocale();
  const isEn = locale === "en";

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [manualUrl, setManualUrl] = useState(previewImage ?? "");

  const { startUpload, isUploading } = useUploadThing("profileAvatar", {
    onUploadProgress: (p) => {
      setUploadProgress(p);
    },
    onClientUploadComplete: (res) => {
      const newUrl = res?.[0]?.url;
      if (newUrl) {
        onUploadSuccess(newUrl);
        setManualUrl(newUrl);
        toast.success(
          isEn ? "Profile photo updated successfully!" : "¡Foto de perfil actualizada con éxito!"
        );
      }
      setUploadProgress(0);
    },
    onUploadError: (err) => {
      setUploadProgress(0);
      toast.error(
        isEn
          ? `Upload error: ${err.message}`
          : `Error al subir la imagen: ${err.message}`
      );
    },
  });

  const handleProcessFiles = async (files: FileList | File[] | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    if (!file.type.startsWith("image/")) {
      toast.error(
        isEn
          ? "Please select a valid image file (PNG, JPG, WEBP)"
          : "Por favor selecciona un archivo de imagen válido (PNG, JPG, WEBP)"
      );
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      toast.error(
        isEn
          ? "The original image exceeds 4MB"
          : "La imagen original no debe superar los 4MB"
      );
      return;
    }

    try {
      const optimized = await optimizeAvatarFiles([file]);
      await startUpload(optimized);
    } catch {
      await startUpload([file]);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (isUploading) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleProcessFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!isUploading) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleApplyUrl = () => {
    const trimmed = manualUrl.trim();
    if (onChangeUrl) {
      onChangeUrl(trimmed);
      toast.success(
        isEn ? "Image link updated!" : "¡Enlace de imagen actualizado!"
      );
    }
  };

  const handleRemoveAvatar = () => {
    onRemove();
    setManualUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    toast.success(
      isEn ? "Profile photo removed" : "Foto de perfil eliminada"
    );
  };

  return (
    <div className="rounded-2xl border border-border/80 bg-card/70 backdrop-blur-md p-4 sm:p-6 shadow-xs transition-all duration-300">
      {/* Header Label */}
      <div className="mb-4 flex items-center justify-between gap-2 border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Camera className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              {t("dashboard.profile.profilePhoto")}
            </h3>
          </div>
        </div>
        <span className="hidden sm:inline-flex rounded-full border border-border/60 bg-muted/40 px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          PNG, JPG, WEBP • 2MB
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6">
        {/* Avatar Visualizer */}
        <div className="relative shrink-0 group">
          <div
            onClick={() => !isUploading && fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            className="relative h-28 w-28 sm:h-32 sm:w-32 rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-border/70 bg-muted/30 shadow-md ring-4 ring-primary/10 transition-all duration-300 group-hover:ring-primary/25 group-hover:border-primary/50 cursor-pointer select-none"
            title={isEn ? "Click to change photo" : "Haz clic para cambiar foto"}
          >
            {previewImage ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewImage}
                  alt={t("dashboard.profile.profilePhoto")}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-1.5 text-white">
                  <div className="rounded-full bg-white/20 p-2 border border-white/30 shadow-inner">
                    <Camera className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-[10px] font-semibold tracking-wider uppercase">
                    {isEn ? "Change" : "Cambiar"}
                  </span>
                </div>
              </>
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-muted/50 to-primary/5 p-3 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary mb-1 transition-transform group-hover:scale-110">
                  <Camera className="h-5 w-5" />
                </div>
                <span className="text-[11px] font-medium text-muted-foreground">
                  {isEn ? "No photo" : "Sin foto"}
                </span>
              </div>
            )}
          </div>

          {/* Floating Action Badge */}
          <button
            type="button"
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-card shadow-sm text-primary transition-all duration-200 hover:scale-110 hover:bg-primary hover:text-primary-foreground"
            aria-label={isEn ? "Upload photo" : "Subir foto"}
          >
            <Camera className="h-4 w-4" />
          </button>
        </div>

        {/* Dropzone & Action Controls */}
        <div className="min-w-0 flex-1 w-full space-y-3">
          {/* Interactive Dropzone */}
          <div
            onClick={() => !isUploading && fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={cn(
              "relative rounded-xl border-2 border-dashed p-4 transition-all duration-200 cursor-pointer text-center select-none",
              isDragOver
                ? "border-primary bg-primary/10 ring-4 ring-primary/15 scale-[1.01]"
                : "border-border/80 hover:border-primary/50 bg-muted/15 hover:bg-muted/30",
              isUploading && "pointer-events-none opacity-85"
            )}
          >
            {isUploading ? (
              <div className="py-2 flex flex-col items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary mb-2" />
                <p className="text-xs font-semibold text-foreground">
                  {isEn ? "Optimizing & uploading..." : "Optimizando y subiendo imagen..."}
                </p>
                <div className="mx-auto mt-2 h-1.5 w-44 max-w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300 rounded-full"
                    style={{ width: `${Math.max(uploadProgress, 20)}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="py-1">
                <Upload className="h-5 w-5 text-primary/80 mx-auto mb-1.5 transition-transform duration-200 group-hover:-translate-y-0.5" />
                <p className="text-xs font-semibold text-foreground">
                  {isDragOver
                    ? (isEn ? "Drop your photo here!" : "¡Suelta tu foto aquí!")
                    : (isEn ? "Click to browse or drag and drop" : "Haz clic para buscar o arrastra tu foto aquí")}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {isEn
                    ? "PNG, JPG or WebP up to 2MB • Automatically optimized to 512×512"
                    : "PNG, JPG o WebP hasta 2MB • Recorte automático a 512×512"}
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons Toolbar */}
          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            <button
              type="button"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>
                {previewImage
                  ? (isEn ? "Change photo" : "Cambiar foto")
                  : (isEn ? "Select file" : "Elegir archivo")}
              </span>
            </button>

            {previewImage ? (
              <button
                type="button"
                disabled={isUploading}
                onClick={handleRemoveAvatar}
                className="inline-flex items-center gap-1.5 rounded-xl border border-destructive/25 bg-destructive/5 px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive hover:text-white transition-all duration-200 disabled:opacity-50 cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>{isEn ? "Remove photo" : "Eliminar foto"}</span>
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => setShowUrlInput(!showUrlInput)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-all duration-200 cursor-pointer",
                showUrlInput
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border bg-background/50 text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Link2 className="h-3.5 w-3.5" />
              <span>{isEn ? "Direct URL" : "URL directa"}</span>
            </button>
          </div>

          {/* Expandable Manual URL input */}
          {showUrlInput && (
            <div className="flex items-center gap-2 pt-1 animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="relative flex-1">
                <input
                  type="url"
                  value={manualUrl}
                  onChange={(e) => setManualUrl(e.target.value)}
                  placeholder="https://ejemplo.com/mi-avatar.jpg"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
                {manualUrl && (
                  <button
                    type="button"
                    onClick={() => setManualUrl("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={handleApplyUrl}
                className="inline-flex items-center gap-1 rounded-xl bg-secondary px-3 py-2 text-xs font-semibold text-secondary-foreground hover:bg-secondary/80 transition-colors"
              >
                <Check className="h-3.5 w-3.5 text-primary" />
                <span>{isEn ? "Apply" : "Aplicar"}</span>
              </button>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <p className="text-xs text-destructive flex items-center gap-1.5 pt-1">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{error}</span>
            </p>
          )}

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/jpg"
            className="hidden"
            onChange={(e) => handleProcessFiles(e.target.files)}
          />
        </div>
      </div>
    </div>
  );
}
