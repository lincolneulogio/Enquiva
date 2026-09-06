"use client";

import Image from "next/image";
import { Copy, Download } from "lucide-react";
import { toast } from "sonner";
import { PaymentBrandMark } from "@/components/payments/PaymentBrandMark";
import { MobilePaymentInstructions } from "./MobilePaymentInstructions";
import { downloadQr } from "./download-qr";
import type { EventMethod } from "./types";

interface YapePaymentCardProps {
  method: EventMethod;
}

export function YapePaymentCard({ method }: YapePaymentCardProps) {
  return (
    <div className="rounded-2xl border border-green-200/50 bg-green-50/40 dark:border-green-900/30 dark:bg-green-950/10 p-5 text-center space-y-4">
      <div className="flex items-center justify-center gap-2">
        <PaymentBrandMark brand="yape" size="md" />
        <p className="text-sm font-bold text-green-800 dark:text-green-400">
          Paga con Yape
        </p>
      </div>
      <p className="text-xs text-muted-foreground">
        Titular: <span className="font-semibold text-foreground">{method.holderName}</span>
      </p>

      {method.phone && (
        <div className="flex items-center justify-between gap-3 rounded-xl bg-background dark:bg-zinc-900/50 border border-green-100 dark:border-green-900/20 px-3.5 py-2">
          <div className="text-left">
            <span className="block text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
              Teléfono Yape
            </span>
            <span className="font-mono text-sm font-bold text-foreground">{method.phone}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(method.phone!);
              toast.success("¡Número de Yape copiado!");
            }}
            className="flex items-center gap-1.5 rounded-lg bg-green-600 hover:bg-green-700 active:scale-95 transition-all text-white px-3 py-1.5 text-xs font-semibold cursor-pointer"
          >
            <Copy className="h-3 w-3" />
            Copiar
          </button>
        </div>
      )}

      {method.qrCodeUrl && (
        <div className="space-y-3">
          <div className="relative mx-auto w-44 h-44 rounded-xl overflow-hidden border border-green-100 dark:border-green-900/30 bg-white p-2">
            <Image
              src={method.qrCodeUrl}
              alt="Yape QR"
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
                `qr-yape-${method.holderName.replace(/\s+/g, "-").toLowerCase()}.png`,
              )
            }
            className="inline-flex items-center gap-1.5 text-xs font-bold text-green-700 dark:text-green-400 hover:underline active:scale-95 transition-all cursor-pointer"
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
