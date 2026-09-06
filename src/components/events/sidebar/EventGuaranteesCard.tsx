"use client";

import React from "react";
import { Check } from "lucide-react";

export function EventGuaranteesCard() {
  return (
    <div className="rounded-2xl border border-border/80 bg-white/60 dark:bg-card/40 p-4 space-y-2.5 shadow-2xs">
      <div className="flex items-center gap-2 text-xs text-foreground/90 font-medium">
        <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
          <Check className="h-2.5 w-2.5" />
        </div>
        <span>Pago 100% seguro (Culqi, Yape, Plin)</span>
      </div>
      <div className="flex items-center gap-2 text-xs text-foreground/90 font-medium">
        <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
          <Check className="h-2.5 w-2.5" />
        </div>
        <span>Acceso con código QR instantáneo</span>
      </div>
      <div className="flex items-center gap-2 text-xs text-foreground/90 font-medium">
        <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
          <Check className="h-2.5 w-2.5" />
        </div>
        <span>Confirmación inmediata por correo electrónico</span>
      </div>
    </div>
  );
}
