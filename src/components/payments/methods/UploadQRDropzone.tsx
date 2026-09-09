"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Upload, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useCloudinaryUpload } from "@/lib/cloudinary/components";
import { deleteOrganizerUploadAction } from "@/actions/admin/upload-cleanup";

interface UploadQRDropzoneProps {
  value: string | null;
  onChange: (v: string | null) => void;
}

export function UploadQRDropzone({ value, onChange }: UploadQRDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const valueRef = useRef(value);
  valueRef.current = value;

  const { startUpload, isUploading } = useCloudinaryUpload("paymentQr", {
    onClientUploadComplete: (res) => {
      const url = res?.[0]?.url;
      if (url) {
        const previous = valueRef.current;
        if (previous && previous !== url) {
          deleteOrganizerUploadAction(previous).catch(() => {});
        }
        onChange(url);
      }
    },
    onUploadError: (err) => {
      toast.error(`Error al subir el QR: ${err.message}`);
    },
  });

  const handleFile = (files: FileList | File[] | null) => {
    if (!files || files.length === 0 || isUploading) return;
    startUpload(Array.from(files));
  };

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files); }}
        onClick={() => !isUploading && inputRef.current?.click()}
        className={cn(
          "relative flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed p-4 transition-colors",
          dragging ? "border-primary bg-primary/5" : "border-border bg-background hover:border-primary/50",
        )}
      >
        {isUploading ? (
          <div className="flex flex-col items-center gap-1.5 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span>Subiendo QR...</span>
          </div>
        ) : value ? (
          <div className="relative">
            <Image src={value} alt="QR" width={120} height={120} className="rounded-lg border object-contain" />
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(null); }}
              className="absolute -right-2 -top-2 rounded-full bg-destructive p-0.5 text-destructive-foreground shadow"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5 text-sm text-muted-foreground">
            <Upload className="h-5 w-5" />
            <span>Arrastra o haz clic para subir el QR</span>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { handleFile(e.target.files); e.target.value = ""; }}
      />
    </div>
  );
}