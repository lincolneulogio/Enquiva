"use client";

import { useState } from "react";
import { Award, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { generateCertificatePdf, CertificatePdfData } from "@/lib/certificates/generate-pdf";

interface DownloadCertificateButtonProps {
  data: CertificatePdfData;
  className?: string;
  variant?: "primary" | "outline" | "pill";
  label?: string;
}

export function DownloadCertificateButton({
  data,
  className,
  variant = "primary",
  label,
}: DownloadCertificateButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      const { download } = await generateCertificatePdf(data);
      download();
      toast.success("Certificado descargado exitosamente");
    } catch (error) {
      console.error("Error generating certificate PDF:", error);
      toast.error("Hubo un problema al generar tu certificado. Intenta nuevamente.");
    } finally {
      setIsGenerating(false);
    }
  };

  const baseStyles =
    "inline-flex items-center justify-center gap-2 font-bold transition-all cursor-pointer select-none active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed";

  const variantStyles = {
    primary:
      "rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground py-3 px-5 text-sm shadow-md shadow-primary/20 hover:shadow-lg",
    outline:
      "rounded-xl border border-primary/40 bg-primary/5 hover:bg-primary/10 text-primary py-2.5 px-4 text-xs font-semibold",
    pill:
      "rounded-full bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-xs font-semibold uppercase tracking-wide shadow-xs",
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={isGenerating}
      className={className || `${baseStyles} ${variantStyles[variant]}`}
    >
      {isGenerating ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Generando Certificado...</span>
        </>
      ) : (
        <>
          <Award className="h-4 w-4" />
          <span>{label || "Descargar Certificado Oficial (PDF)"}</span>
          <Download className="h-3.5 w-3.5 opacity-80" />
        </>
      )}
    </button>
  );
}
