"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { useCloudinaryUpload } from "@/lib/cloudinary/components";
import { deleteOrphanUploadAction } from "@/actions/admin/upload-cleanup";

export interface UseImpactImageUploadOptions {
  value: string;
  onChange: (url: string) => void;
  locale?: "es" | "en";
}

export function useImpactImageUpload({
  value,
  onChange,
  locale = "es",
}: UseImpactImageUploadOptions) {
  const isEn = locale === "en";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const { startUpload, isUploading } = useCloudinaryUpload("landingImpactImage", {
    onUploadProgress: (p) => {
      setUploadProgress(p);
    },
    onClientUploadComplete: (res) => {
      const newUrl = res?.[0]?.url;
      if (newUrl) {
        if (value && value.includes("res.cloudinary.com")) {
          deleteOrphanUploadAction(value).catch(() => {});
        }
        onChange(newUrl);
        toast.success(
          isEn ? "Image uploaded successfully" : "Imagen subida exitosamente",
        );
      }
      setUploadProgress(0);
    },
    onUploadError: (err) => {
      setUploadProgress(0);
      toast.error(
        isEn
          ? `Upload error: ${err.message}`
          : `Error al subir imagen: ${err.message}`,
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
          : "Por favor selecciona un archivo de imagen válido (JPG, PNG, WEBP)",
      );
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      toast.error(
        isEn
          ? "The image exceeds the 4MB limit"
          : "La imagen supera el límite de 4MB",
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
    if (value && value.includes("res.cloudinary.com")) {
      deleteOrphanUploadAction(value).catch(() => {});
    }
    onChange("");
    toast.info(isEn ? "Image removed" : "Imagen eliminada");
  };

  return {
    fileInputRef,
    isDragging,
    uploadProgress,
    isUploading,
    handleFileSelect,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleRemoveImage,
  };
}
