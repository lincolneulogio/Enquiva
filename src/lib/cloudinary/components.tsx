"use client";

/**
 * Helpers client de subida a Cloudinary con la MISMA API que UploadThing:
 * useCloudinaryUpload / UploadButton / UploadDropzone.
 * El servidor firma la subida en POST /api/cloudinary/sign y el navegador
 * sube el archivo directo a api.cloudinary.com (sin pasar bytes por nuestro server).
 */

import { useRef, useState } from "react";
import type { ReactNode } from "react";
import { CLOUDINARY_ENDPOINTS, type CloudinaryEndpointName } from "./index";
import type { CloudinaryUploadSign } from "./server";
import { cn } from "@/lib/utils";

export interface UploadedFile {
  url: string;
  name: string;
  size: number;
  type: string;
}

interface UseCloudinaryUploadOptions {
  onUploadProgress?: (progress: number) => void;
  onClientUploadComplete?: (res: UploadedFile[]) => void;
  onUploadError?: (error: Error) => void;
  onUploadBegin?: (info: { file: File }) => void;
}

function matchesMime(mime: string, patterns: string[]): boolean {
  return patterns.some((pattern) => {
    if (pattern === "image/*") return mime.startsWith("image/");
    return mime === pattern;
  });
}

function uploadFileToCloudinary(
  file: File,
  sign: CloudinaryUploadSign,
  onProgress: (p: number) => void
): Promise<UploadedFile> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("file", file);
    form.append("cloud_name", sign.cloudName);
    form.append("api_key", sign.apiKey);
    form.append("timestamp", String(sign.timestamp));
    form.append("public_id", sign.publicId);
    form.append("signature", sign.signature);

    const xhr = new XMLHttpRequest();
    xhr.open(
      "POST",
      `https://api.cloudinary.com/v1_1/${sign.cloudName}/${sign.resourceType}/upload`
    );

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onerror = () => reject(new Error("Network error durante la subida"));
    xhr.onload = () => {
      let data: { secure_url?: string; error?: { message?: string } } | null = null;
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        reject(new Error("Respuesta inválida de Cloudinary"));
        return;
      }
      if (xhr.status >= 200 && xhr.status < 300 && data?.secure_url) {
        resolve({
          url: data.secure_url,
          name: file.name,
          size: file.size,
          type: file.type,
        });
      } else {
        reject(new Error(data?.error?.message || "Subida a Cloudinary falló"));
      }
    };
    xhr.send(form);
  });
}

interface UploadSignResponse extends CloudinaryUploadSign {
  maxSizeBytes: number;
  allowedMimeTypes: string[];
}

async function requestUploadSign(
  endpoint: CloudinaryEndpointName
): Promise<UploadSignResponse> {
  const res = await fetch("/api/cloudinary/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint }),
  });

  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error || `No se pudo autorizar la subida (${res.status})`);
  }

  return res.json();
}

export function useCloudinaryUpload(
  endpoint: CloudinaryEndpointName,
  options: UseCloudinaryUploadOptions = {}
) {
  const [isUploading, setIsUploading] = useState(false);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  async function startUpload(files: File[]) {
    if (!files || files.length === 0) return;

    const config = CLOUDINARY_ENDPOINTS[endpoint];
    if (!config) {
      optionsRef.current.onUploadError?.(new Error("Endpoint de subida inválido"));
      return;
    }

    // Validación previa (same limits que UploadThing).
    if (files.length > config.maxFileCount) {
      optionsRef.current.onUploadError?.(
        new Error(`Máximo ${config.maxFileCount} archivo(s) por carga`)
      );
      return;
    }
    const invalid = files.find(
      (f) => f.size > config.maxSizeBytes || !matchesMime(f.type, config.allowedMimeTypes)
    );
    if (invalid) {
      optionsRef.current.onUploadError?.(
        new Error(
          `"${invalid.name}" no cumple los requisitos (${
            invalid.size > config.maxSizeBytes
              ? `máx ${Math.round(config.maxSizeBytes / 1024 / 1024)}MB`
              : "formato no permitido"
          })`
        )
      );
      return;
    }

    setIsUploading(true);
    const uploaded: UploadedFile[] = [];
    try {
      for (const file of files) {
        optionsRef.current.onUploadBegin?.({ file });
        const sign = await requestUploadSign(endpoint);
        const result = await uploadFileToCloudinary(
          file,
          sign,
          (p) => optionsRef.current.onUploadProgress?.(p)
        );
        uploaded.push(result);
      }
      optionsRef.current.onClientUploadComplete?.(uploaded);
    } catch (error) {
      optionsRef.current.onUploadError?.(
        error instanceof Error ? error : new Error("Error inesperado al subir")
      );
    } finally {
      setIsUploading(false);
    }
  }

  return { startUpload, isUploading };
}

interface ButtonContentContext {
  isUploading: boolean;
  isUploadingComplete: boolean;
  isUploadPaused: boolean;
  uploadProgress: number;
}

type ButtonRenderProp = ReactNode | ((ctx: ButtonContentContext) => ReactNode);

interface SharedUploadProps {
  endpoint: CloudinaryEndpointName;
  onClientUploadComplete?: (res: UploadedFile[]) => void;
  onUploadError?: (error: Error) => void;
  onUploadBegin?: () => void;
  content?: {
    label?: ReactNode;
    allowedContent?: ReactNode;
    button?: ButtonRenderProp;
  };
  appearance?: Record<string, string | undefined>;
  config?: Record<string, unknown>;
  className?: string;
}

function defaultButtonLabel(isUploading: boolean): ReactNode {
  return isUploading ? "Subiendo..." : "Subir";
}

function buildAccept(endpoint: CloudinaryEndpointName): string {
  const patterns = CLOUDINARY_ENDPOINTS[endpoint]?.allowedMimeTypes ?? [];
  return patterns
    .map((p) => (p === "image/*" ? "image/png,image/jpeg,image/webp,image/gif" : p))
    .join(",");
}

export function UploadButton({
  endpoint,
  onClientUploadComplete,
  onUploadError,
  content,
  appearance = {},
  className,
}: SharedUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const { startUpload, isUploading } = useCloudinaryUpload(endpoint, {
    onClientUploadComplete,
    onUploadError,
  });

  const renderedButton =
    typeof content?.button === "function"
      ? content.button({
          isUploading,
          isUploadingComplete: false,
          isUploadPaused: false,
          uploadProgress: 0,
        })
      : (content?.button ?? defaultButtonLabel(isUploading));

  return (
    <div className={cn("flex flex-col items-center gap-1.5", appearance.container, className)}>
      <input
        ref={inputRef}
        type="file"
        accept={buildAccept(endpoint)}
        multiple={CLOUDINARY_ENDPOINTS[endpoint].maxFileCount > 1}
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) {
            startUpload(Array.from(e.target.files)).finally(() => {
              e.target.value = "";
            });
          }
        }}
      />
      <button
        type="button"
        disabled={isUploading}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer",
          appearance.button
        )}
      >
        {renderedButton}
      </button>
      {content?.allowedContent != null && (
        <span className={cn("text-[10px] text-muted-foreground", appearance.allowedContent)}>
          {content.allowedContent}
        </span>
      )}
    </div>
  );
}

export function UploadDropzone({
  endpoint,
  onClientUploadComplete,
  onUploadError,
  onUploadBegin,
  content,
  appearance = {},
  className,
}: SharedUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const { startUpload, isUploading } = useCloudinaryUpload(endpoint, {
    onClientUploadComplete,
    onUploadError,
    onUploadBegin: onUploadBegin ? () => onUploadBegin() : undefined,
  });

  const handleFiles = (files: FileList | File[] | null) => {
    if (!files || files.length === 0) return;
    startUpload(Array.from(files)).finally(() => {
      if (inputRef.current) inputRef.current.value = "";
    });
  };

  const renderedButton =
    typeof content?.button === "function"
      ? content.button({
          isUploading,
          isUploadingComplete: false,
          isUploadPaused: false,
          uploadProgress: 0,
        })
      : (content?.button ?? defaultButtonLabel(isUploading));

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setIsDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        if (!isUploading) handleFiles(e.dataTransfer.files);
      }}
      className={cn(
        "flex flex-col items-center justify-center gap-2 py-3 px-2 text-center cursor-pointer",
        isDragging && "ring-2 ring-primary",
        appearance.container,
        className
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={buildAccept(endpoint)}
        multiple={CLOUDINARY_ENDPOINTS[endpoint].maxFileCount > 1}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      {content?.label != null && (
        <span className={cn("text-xs text-muted-foreground", appearance.label)}>
          {content.label}
        </span>
      )}
      {content?.allowedContent != null && (
        <span className={cn("text-[10px] text-muted-foreground", appearance.allowedContent)}>
          {content.allowedContent}
        </span>
      )}
      <button
        type="button"
        disabled={isUploading}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer",
          appearance.button
        )}
      >
        {renderedButton}
      </button>
    </div>
  );
}