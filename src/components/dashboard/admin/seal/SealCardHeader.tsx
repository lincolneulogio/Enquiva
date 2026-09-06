import { Award, CheckCircle2, ShieldCheck } from "lucide-react";

interface SealCardHeaderProps {
  isCustomSeal: boolean;
  isEn: boolean;
}

export function SealCardHeader({ isCustomSeal, isEn }: SealCardHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
          <Award className="h-3.5 w-3.5" />
          <span>
            {isEn
              ? "Accreditation & Digital Credentials"
              : "Acreditación y Credenciales Oficiales"}
          </span>
        </div>
        <h3 className="text-xl font-bold tracking-tight text-foreground">
          {isEn
            ? "Official Certificate Seal (Enquiva Verified)"
            : "Sello Oficial de Certificados (Enquiva Verified)"}
        </h3>
        <p className="text-xs text-muted-foreground max-w-2xl">
          {isEn
            ? "Upload the official seal image displayed in the center of all participation and achievement certificates generated across the platform."
            : "Configura el sello holográfico digital que se ubica en el centro de todos los diplomas y certificados de participación emitidos para los asistentes de la plataforma."}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {isCustomSeal ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {isEn ? "Custom Seal Active" : "Sello Personalizado"}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary border border-primary/20">
            <ShieldCheck className="h-3.5 w-3.5" />
            {isEn ? "Default Official Seal" : "Sello Enquiva Oficial"}
          </span>
        )}
      </div>
    </div>
  );
}
