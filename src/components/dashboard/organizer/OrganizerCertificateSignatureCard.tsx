"use client";

import { useState, useRef, useEffect } from "react";
import {
  PenTool,
  Upload,
  RotateCcw,
  CheckCircle2,
  Trash2,
  Loader2,
  Briefcase,
  Award,
  ShieldCheck,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { saveOrganizerCertificateSignatureAction } from "@/actions/organizer/signature";

interface OrganizerCertificateSignatureCardProps {
  initialSignatureUrl?: string | null;
  initialSignatureTitle?: string | null;
  organizerName: string;
  organizationName?: string | null;
  locale?: "es" | "en";
}

export function OrganizerCertificateSignatureCard({
  initialSignatureUrl,
  initialSignatureTitle,
  organizerName,
  organizationName,
  locale = "es",
}: OrganizerCertificateSignatureCardProps) {
  const [signatureMode, setSignatureMode] = useState<"upload" | "draw">("upload");
  const [signatureUrl, setSignatureUrl] = useState<string | null>(initialSignatureUrl || null);
  const [signatureTitle, setSignatureTitle] = useState<string>(
    initialSignatureTitle || "Organizador Responsable"
  );
  const [isSaving, setIsSaving] = useState(false);

  // Canvas drawing state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  // Initialize canvas
  useEffect(() => {
    if (signatureMode === "draw" && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.strokeStyle = "#0f172a"; // slate-900 deep ink
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
      }
    }
  }, [signatureMode]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsDrawing(true);
    setHasDrawn(true);

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL("image/png");
      setSignatureUrl(dataUrl);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    setHasDrawn(false);
    setSignatureUrl(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error(
        locale === "en" ? "Please select a valid image" : "Selecciona un archivo de imagen válido"
      );
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error(
        locale === "en" ? "Image must be under 2MB" : "La imagen debe pesar menos de 2MB"
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result);
      setSignatureUrl(result);
      toast.success(
        locale === "en" ? "Signature loaded into preview" : "Firma cargada en la vista previa"
      );
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveOrganizerCertificateSignatureAction({
        signatureUrl: signatureUrl,
        signatureTitle: signatureTitle,
      });
      toast.success(
        locale === "en"
          ? "Official signature and title saved successfully!"
          : "¡Firma oficial y cargo guardados exitosamente!"
      );
    } catch (err) {
      console.error("Error saving signature:", err);
      toast.error(
        locale === "en"
          ? "Failed to save signature settings"
          : "Error al guardar la configuración de firma"
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <span>
                {locale === "en"
                  ? "Accreditation & Official Certificate Signature"
                  : "Acreditación & Firma Oficial para Certificados"}
              </span>
              <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300 border border-amber-500/20">
                Oficial
              </span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {locale === "en"
                ? "Configure the signature, institutional seal, and authority title printed on your event certificates."
                : "Configura la firma manuscrita, rúbrica o sello oficial que se estampará en los certificados emitidos de tus eventos."}
            </p>
          </div>
        </div>
      </div>

      {/* Authority Title / Position */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <Briefcase className="h-3.5 w-3.5 text-primary" />
          <span>
            {locale === "en"
              ? "Your Official Title / Position on Certificates"
              : "Tu Cargo Oficial / Título en los Certificados"}
          </span>
        </label>
        <input
          type="text"
          value={signatureTitle}
          onChange={(e) => setSignatureTitle(e.target.value)}
          placeholder={
            locale === "en"
              ? "e.g. Academic Director, Dean, General Organizer"
              : "Ej. Director Académico, Decano, Organizador General, Presidente de Comité"
          }
          className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-hidden"
        />
        <p className="text-[11px] text-muted-foreground">
          {locale === "en"
            ? "This title will appear directly under your name on the certificate signature line."
            : "Este cargo se imprimirá debajo de tu nombre en la línea de firma del certificado."}
        </p>
      </div>

      {/* Mode Selector */}
      <div className="space-y-3">
        <label className="text-xs font-semibold text-foreground block">
          {locale === "en"
            ? "Signature / Institutional Stamp Source"
            : "Origen de la Firma o Sello Institucional"}
        </label>
        <div className="flex rounded-xl bg-muted/60 p-1 border border-border gap-1 w-fit">
          <button
            type="button"
            onClick={() => setSignatureMode("upload")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
              signatureMode === "upload"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Upload className="h-3.5 w-3.5" />
            <span>
              {locale === "en"
                ? "Upload Image / Stamp (PNG/JPG)"
                : "Subir Imagen / Sello (PNG/JPG)"}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setSignatureMode("draw")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
              signatureMode === "draw"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <PenTool className="h-3.5 w-3.5" />
            <span>{locale === "en" ? "Draw Digital Signature" : "Dibujar Firma en Pantalla"}</span>
          </button>
        </div>
      </div>

      {/* Mode A: File Upload */}
      {signatureMode === "upload" && (
        <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-5 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Upload className="h-5 w-5" />
          </div>
          <p className="mt-2 text-xs font-semibold text-foreground">
            {locale === "en" ? "Select signature file" : "Selecciona tu firma escaneada o sello"}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {locale === "en"
              ? "PNG with transparent background recommended (Max 2MB)"
              : "Recomendado archivo PNG con fondo transparente (Máx. 2MB)"}
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <label className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 text-xs font-bold transition cursor-pointer shadow-xs">
              <span>{locale === "en" ? "Browse Files" : "Explorar Archivos"}</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleFileUpload}
                className="sr-only"
              />
            </label>
            {signatureUrl && (
              <button
                type="button"
                onClick={() => setSignatureUrl(null)}
                className="rounded-xl border border-destructive/30 bg-destructive/5 hover:bg-destructive/10 text-destructive px-3 py-2 text-xs font-semibold transition"
                title={locale === "en" ? "Remove signature" : "Eliminar firma"}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Mode B: Canvas Drawing */}
      {signatureMode === "draw" && (
        <div className="space-y-3">
          <div className="rounded-2xl border border-border bg-white p-2 shadow-inner flex flex-col items-center">
            <canvas
              ref={canvasRef}
              width={420}
              height={140}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="w-full max-w-[420px] h-[140px] border border-dashed border-slate-200 rounded-xl bg-white touch-none cursor-crosshair"
            />
            <p className="text-[10px] text-slate-400 mt-2">
              {locale === "en"
                ? "Draw your signature above using your mouse, stylus or finger."
                : "Traza tu firma aquí usando el mouse, lápiz táctil o dedo."}
            </p>
          </div>
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={clearCanvas}
              className="rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>{locale === "en" ? "Clear" : "Limpiar trazo"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Live Signature Preview Card */}
      <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-b from-amber-500/5 to-transparent p-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-1.5 uppercase tracking-wider">
            <Eye className="h-3.5 w-3.5 text-amber-600" />
            <span>
              {locale === "en"
                ? "Official Certificate Signature Line Preview"
                : "Vista Previa de la Línea de Firma en el Certificado"}
            </span>
          </span>
          <span className="text-[10px] text-muted-foreground font-mono">
            {signatureUrl ? "✓ Firma cargada" : "Sin firma (rúbrica automática)"}
          </span>
        </div>

        <div className="rounded-xl bg-card border border-border/80 p-6 flex flex-col items-center justify-center text-center">
          {/* Signature Image or Text */}
          <div className="h-16 flex items-center justify-center mb-1">
            {signatureUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={signatureUrl}
                alt="Firma oficial"
                className="max-h-16 max-w-[180px] object-contain"
              />
            ) : (
              <span className="font-serif italic text-base text-slate-600 select-none">
                Firma Digital Verificada
              </span>
            )}
          </div>

          {/* Signature Line */}
          <div className="w-56 h-0.5 bg-slate-700 my-1" />

          {/* Details below line */}
          <p className="font-bold text-foreground text-sm mt-1">{organizerName}</p>
          <p className="text-xs text-muted-foreground font-medium">
            {organizationName || "Entidad Organizadora Responsable"}
          </p>
          <p className="text-[11px] text-muted-foreground/80 mt-0.5 italic">
            {signatureTitle || "Firma y Sello de Autoridad Certificadora"}
          </p>
        </div>
      </div>

      {/* Save Button */}
      <div className="pt-2 flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 text-sm font-bold shadow-md shadow-primary/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{locale === "en" ? "Saving..." : "Guardando cambios..."}</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" />
              <span>
                {locale === "en" ? "Save Official Signature" : "Guardar Firma Oficial"}
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
