"use client";

import Image from "next/image";
import { Copy, Download } from "lucide-react";
import { toast } from "sonner";
import { PaymentBrandMark } from "@/components/payments/PaymentBrandMark";
import { MobilePaymentInstructions } from "./MobilePaymentInstructions";
import { downloadQr } from "./download-qr";
import type { EventMethod } from "./types";

interface PlinPaymentCardProps {
  method: EventMethod;
}

export function PlinPaymentCard({ method }: PlinPaymentCardProps) {
  return (
    <div className="rounded-2xl border border-blue-200/50 bg-blue-50/40 dark:border-blue-900/30 dark:bg-blue-950/10 p-5 text-center space-y-4">
      <div className="flex items-center justify-center gap-2">
        <PaymentBrandMark brand="plin" size="md" />
        <p className="text-sm font-bold text-blue-800 dark:text-blue-400">
          Paga con Plin
        </p>
      </div>
      <p className="text-xs text-muted-foreground">
        Titular: <span className="font-semibold text-foreground">{method.holderName}</span>
      </p>

      {method.phone && (
        <div className="flex items-center justify-between gap-3 rounded-xl bg-background dark:bg-zinc-900/50 border border-blue-100 dark:border-blue-900/20 px-3.5 py-2">
          <div className="text-left">
            <span className="block text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
              Teléfono Plin
            </span>
            <span className="font-mono text-sm font-bold text-foreground">{method.phone}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(method.phone!);
              toast.success("¡Número de Plin copiado!");
            }}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all text-white px-3 py-1.5 text-xs font-semibold cursor-pointer"
          >
            <Copy className="h-3 w-3" />
            Copiar
          </button>
        </div>
      )}

      {method.qrCodeUrl && (
        <div className="space-y-3">
          <div className="relative mx-auto w-44 h-44 rounded-xl overflow-hidden border border-blue-100 dark:border-blue-900/30 bg-white p-2">
            <Image
              src={method.qrCodeUrl}
              alt="Plin QR"
              width={160}
              height={160}
              className="mx-auto rounded-lg object-contain h-full w-full"
            />
          </div>

          <button
            type="button"
            onClick={() =>
              downloadQr(
                method.qrCodeUrl!,
                `qr-plin-${method.holderName.replace(/\s+/g, "-").toLowerCase()}.png`,
              )
            }
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 dark:text-blue-400 hover:underline active:scale-95 transition-all cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            Guardar QR en Galería
          </button>
        </div>
      )}

      <MobilePaymentInstructions />
    </div>
  );
}
