"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { toast } from "sonner";
import {
  Loader2,
  X,
  Image as ImageIcon,
  FileUp,
} from "lucide-react";
import { useUploadThing } from "@/lib/uploadthing/components";
import { deleteOrphanUploadAction } from "@/actions/admin/upload-cleanup";

interface ImpactImageUploadFieldProps {
  label: string;
  description?: string;
  value: string;
  onChange: (url: string) => void;
  locale?: "es" | "en";
}

export function ImpactImageUploadField({
  label,
  description,
  value,
  onChange,
  locale = "es",
}: ImpactImageUploadFieldProps) {
  const isEn = locale === "en";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const { startUpload, isUploading } = useUploadThing("landingImpactImage", {
    onUploadProgress: (p) => {
      setUploadProgress(p);
    },
    onClientUploadComplete: (res) => {
      const newUrl = res?.[0]?.url;
      if (newUrl) {
        if (value && (value.includes("uploadthing") || value.includes("utfs.io"))) {
          deleteOrphanUploadAction(value).catch(() => {});
        }
        onChange(newUrl);
        toast.success(
          isEn ? "Image uploaded successfully" : "Imagen subida exitosamente"
        );
      }
      setUploadProgress(0);
    },
    onUploadError: (err) => {
      setUploadProgress(0);
      toast.error(
        isEn
          ? `Upload error: ${err.message}`
          : `Error al subir imagen: ${err.message}`
      );
    },
  });

  const handleFileSelect = async (files: FileList | File[] | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith("image/")) {
      toast.error(
        isEn
          ? "Please select a valid image file (JPG, PNG, WEBP)"
          : "Por favor selecciona un archivo de imagen válido (JPG, PNG, WEBP)"
      );
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      toast.error(
        isEn
          ? "The image exceeds the 4MB limit"
          : "La imagen supera el límite de 4MB"
      );
      return;
    }

    await startUpload([file]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleFileSelect(e.dataTransfer.files);
    }
  };

  const handleRemoveImage = () => {
    if (value && (value.includes("uploadthing") || value.includes("utfs.io"))) {
      deleteOrphanUploadAction(value).catch(() => {});
    }
    onChange("");
    toast.info(isEn ? "Image removed" : "Imagen eliminada");
  };

  return (
    <div className="space-y-2.5 rounded-xl border border-border/70 bg-card/60 p-3.5 sm:p-4 transition-colors">
      <div>
        <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <ImageIcon className="h-3.5 w-3.5 text-primary" />
          {label}
        </label>
        {description && (
          <p className="text-[11px] text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>

      <div className="space-y-3">
        {/* Zona de previsualización y botón de selección de archivo */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Miniatura actual */}
          <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-lg border border-border bg-zinc-950 shadow-sm">
            {value ? (
              <>
                <Image
                  src={value}
                  alt={label}
                  fill
                  sizes="128px"
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  disabled={isUploading}
                  className="absolute top-1 right-1 rounded-full bg-black/70 p-1 text-white hover:bg-destructive transition-colors"
                  title={isEn ? "Remove image" : "Eliminar imagen"}
                >
                  <X className="h-3 w-3" />
                </button>
              </>
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                <ImageIcon className="h-6 w-6 opacity-40" />
              </div>
            )}
          </div>

          {/* Dropzone interactivo que abre el input type="file" */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className={`group flex-1 w-full flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-3.5 text-center transition-all cursor-pointer ${
              isDragging
                ? "border-primary bg-primary/10"
                : "border-border/80 bg-background/50 hover:border-primary/60 hover:bg-muted/30"
            } ${isUploading ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/jpg"
              className="hidden"
              disabled={isUploading}
              onChange={(e) => {
                handleFileSelect(e.target.files);
                e.target.value = "";
              }}
            />

            {isUploading ? (
              <div className="flex flex-col items-center gap-1.5 py-1">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="text-xs font-semibold text-foreground">
                  {isEn ? "Uploading image..." : "Subiendo imagen..."} {uploadProgress > 0 ? `(${uploadProgress}%)` : ""}
                </span>
                <div className="w-32 h-1.5 rounded-full bg-muted overflow-hidden mt-1">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1 py-0.5">
                <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                  <FileUp className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                  <span>{isEn ? "Choose file or drag & drop" : "Elegir archivo o arrastrar aquí"}</span>
                </div>
                <span className="text-[10px] text-muted-foreground">
                  PNG, JPG, WEBP &mdash; {isEn ? "Max 4MB" : "Máx. 4MB"}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
