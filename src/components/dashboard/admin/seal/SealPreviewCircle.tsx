import Image from "next/image";
import { Award } from "lucide-react";

interface SealPreviewCircleProps {
  sealUrl: string;
  isCustomSeal: boolean;
  isEn: boolean;
}

export function SealPreviewCircle({
  sealUrl,
  isCustomSeal,
  isEn,
}: SealPreviewCircleProps) {
  return (
    <div className="lg:col-span-4 flex flex-col items-center justify-center p-6 rounded-2xl border border-border/80 bg-muted/20 text-center">
      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
        {isEn ? "Seal Preview" : "Vista Previa del Sello"}
      </p>

      <div className="relative h-44 w-44 rounded-full border-4 border-amber-500/40 bg-white p-2 shadow-xl shadow-amber-500/10 flex items-center justify-center overflow-hidden">
        {sealUrl ? (
          <Image
            src={sealUrl}
            alt="Enquiva Verified Seal"
            width={160}
            height={160}
            className="h-full w-full object-contain rounded-full"
            priority
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-muted-foreground">
            <Award className="h-12 w-12 text-amber-500" />
            <span className="text-xs font-semibold mt-1">Sin sello</span>
          </div>
        )}
      </div>

      <p className="mt-4 text-xs font-semibold text-foreground">
        {isCustomSeal
          ? isEn
            ? "Custom cryptographic seal"
            : "Sello criptográfico personalizado"
          : isEn
            ? "Standard official Enquiva Verified seal"
            : "Sello oficial Enquiva Verified"}
      </p>
      <p className="text-[11px] text-muted-foreground mt-0.5">
        {isEn ? "Format: Transparent PNG / JPG" : "Formato óptimo: PNG con fondo transparente"}
      </p>
    </div>
  );
}
