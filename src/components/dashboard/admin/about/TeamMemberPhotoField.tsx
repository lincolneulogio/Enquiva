"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Loader2, X, User as UserIcon, FileUp } from "lucide-react";
import { toast } from "sonner";
import { useUploadThing } from "@/lib/uploadthing/components";
import { deleteOrphanUploadAction } from "@/actions/admin/upload-cleanup";

interface TeamMemberPhotoFieldProps {
  value: string;
  onChange: (url: string) => void;
}

export function TeamMemberPhotoField({ value, onChange }: TeamMemberPhotoFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const { startUpload, isUploading } = useUploadThing("teamMemberPhoto", {
    onUploadProgress: (p) => setUploadProgress(p),
    onClientUploadComplete: (res) => {
      const newUrl = res?.[0]?.url;
      if (newUrl) {
        if (value && (value.includes("uploadthing") || value.includes("utfs.io"))) {
          deleteOrphanUploadAction(value).catch(() => {});
        }
        onChange(newUrl);
        toast.success("Foto subida exitosamente");
      }
      setUploadProgress(0);
    },
    onUploadError: (err) => {
      setUploadProgress(0);
      toast.error(`Error al subir la foto: ${err.message}`);
    },
  });

  const handleFileSelect = async (files: FileList | File[] | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith("image/")) {
      toast.error("Selecciona un archivo de imagen válido (JPG, PNG, WEBP)");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("La foto supera el límite de 2MB");
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
    toast.info("Foto eliminada");
  };

  return (
    <div className="space-y-2.5 rounded-xl border border-border/70 bg-card/60 p-3.5 sm:p-4 transition-colors">
      <div>
        <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <UserIcon className="h-3.5 w-3.5 text-primary" />
          Foto del Miembro
        </label>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          Sube una foto de perfil del miembro del equipo
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border border-border bg-zinc-950 shadow-sm">
            {value ? (
              <>
                <Image
                  src={value}
                  alt="Foto del miembro"
                  fill
                  sizes="80px"
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  disabled={isUploading}
                  className="absolute top-0.5 right-0.5 rounded-full bg-black/70 p-1 text-white hover:bg-destructive transition-colors"
                  title="Eliminar foto"
                >
                  <X className="h-3 w-3" />
                </button>
              </>
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                <UserIcon className="h-8 w-8 opacity-40" />
              </div>
            )}
          </div>

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
                  Subiendo foto... {uploadProgress > 0 ? `(${uploadProgress}%)` : ""}
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
                  <span>Elegir foto o arrastrar aquí</span>
                </div>
                <span className="text-[10px] text-muted-foreground">
                  PNG, JPG, WEBP &mdash; Máx. 2MB
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
