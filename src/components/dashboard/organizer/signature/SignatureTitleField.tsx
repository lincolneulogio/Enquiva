import { Briefcase } from "lucide-react";

interface SignatureTitleFieldProps {
  signatureTitle: string;
  setSignatureTitle: (title: string) => void;
  locale: "es" | "en";
}

export function SignatureTitleField({
  signatureTitle,
  setSignatureTitle,
  locale,
}: SignatureTitleFieldProps) {
  return (
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
  );
}
