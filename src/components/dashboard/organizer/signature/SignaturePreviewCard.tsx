import { Eye } from "lucide-react";

interface SignaturePreviewCardProps {
  signatureUrl: string | null;
  signatureTitle: string;
  organizerName: string;
  organizationName?: string | null;
  locale: "es" | "en";
}

export function SignaturePreviewCard({
  signatureUrl,
  signatureTitle,
  organizerName,
  organizationName,
  locale,
}: SignaturePreviewCardProps) {
  return (
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
  );
}
