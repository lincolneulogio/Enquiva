import { Award } from "lucide-react";

interface SignatureHeaderProps {
  locale: "es" | "en";
}

export function SignatureHeader({ locale }: SignatureHeaderProps) {
  return (
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
  );
}
