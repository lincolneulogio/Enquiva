import Image from "next/image";
import { Sparkles, Award, QrCode } from "lucide-react";

interface SealCertificateSimulationProps {
  sealUrl: string;
  isEn: boolean;
}

export function SealCertificateSimulation({
  sealUrl,
  isEn,
}: SealCertificateSimulationProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-4 w-4 text-amber-500" />
        <h4 className="text-sm font-bold text-foreground">
          {isEn ? "Live Placement on Official Certificate" : "Ubicación en el Certificado Oficial"}
        </h4>
      </div>
      <p className="text-xs text-muted-foreground mb-6">
        {isEn
          ? "Here is how the seal sits in relation to the organizer signature and the anti-fraud QR validation."
          : "Así se visualiza el sello en el pie del documento, equilibrado entre la firma de la autoridad organizadora y el código QR de verificación anti-fraude."}
      </p>

      {/* Mockup en miniatura del pie del certificado */}
      <div className="rounded-2xl border border-border/80 bg-slate-50 dark:bg-slate-950/60 p-6 sm:p-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center text-center">
          {/* Lado Izquierdo: Firma del Organizador */}
          <div className="flex flex-col items-center">
            <div className="h-10 border-b border-slate-400 dark:border-slate-600 w-36 flex items-end justify-center pb-1">
              <span className="font-serif italic text-xs text-slate-700 dark:text-slate-300">
                Firma Digital Verificada
              </span>
            </div>
            <p className="text-[11px] font-bold text-foreground mt-2">Organizador Demo</p>
            <p className="text-[10px] text-muted-foreground">Firma y Sello de Autoridad</p>
          </div>

          {/* Centro: Sello Oficial Dinámico */}
          <div className="flex flex-col items-center">
            <div className="relative h-20 w-20 rounded-full border-2 border-amber-500/50 bg-white p-1 shadow-md shadow-amber-500/10 flex items-center justify-center overflow-hidden">
              {sealUrl ? (
                <Image
                  src={sealUrl}
                  alt="Sello Dinámico"
                  width={72}
                  height={72}
                  className="h-full w-full object-contain rounded-full"
                />
              ) : (
                <Award className="h-8 w-8 text-amber-600" />
              )}
            </div>
            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 mt-2 uppercase tracking-wider">
              Sello Oficial
            </span>
          </div>

          {/* Lado Derecho: Código QR Anti-fraude */}
          <div className="flex flex-col items-center">
            <div className="p-2 rounded-xl bg-white border border-border shadow-xs">
              <QrCode className="h-12 w-12 text-slate-900" />
            </div>
            <span className="text-[10px] font-bold text-foreground mt-2">
              ENQ-2026-CERT-BKLXLK
            </span>
            <p className="text-[9px] text-muted-foreground">Escanea para verificar</p>
          </div>
        </div>
      </div>
    </div>
  );
}
