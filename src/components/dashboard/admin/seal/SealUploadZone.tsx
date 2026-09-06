"use client";

import { useRef, useState } from "react";
import { Upload, Loader2, RotateCcw, CheckCircle2 } from "lucide-react";

interface SealUploadZoneProps {
  isUploading: boolean;
  uploadProgress: number;
  isPending: boolean;
  isCustomSeal: boolean;
  isEn: boolean;
  onFileSelect: (files: FileList | File[] | null) => void;
  onResetToDefault: () => void;
  onSave: () => void;
}

export function SealUploadZone({
  isUploading,
  uploadProgress,
  isPending,
  isCustomSeal,
  isEn,
  onFileSelect,
  onResetToDefault,
  onSave,
}: SealUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="lg:col-span-8 space-y-5">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
        onChange={(e) => onFileSelect(e.target.files)}
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
          onFileSelect(e.dataTransfer.files);
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
              onClick={onResetToDefault}
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
            onClick={onSave}
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
  );
}
