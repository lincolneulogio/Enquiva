"use client";

import React from "react";
import { Ticket as TicketIcon, ChevronDown } from "lucide-react";
import { ActiveGuestQrData } from "./types";

interface GuestQrModalProps {
  activeGuestQr: ActiveGuestQrData | null;
  onClose: () => void;
  locale: string;
}

export function GuestQrModal({
  activeGuestQr,
  onClose,
  locale,
}: GuestQrModalProps) {
  if (!activeGuestQr) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in">
      <div className="relative w-full max-w-sm bg-card border border-border rounded-3xl shadow-2xl overflow-hidden animate-in scale-in-95 duration-200 text-center">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border bg-muted/40 text-left">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <TicketIcon className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-foreground text-sm leading-snug">
                {locale === "en" ? "Guest Ticket QR" : "Código QR del Invitado"}
              </h3>
              <p
                className="text-[11px] text-muted-foreground mt-0.5 truncate max-w-[200px]"
                title={activeGuestQr.name}
              >
                {activeGuestQr.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full border border-border hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>

        {/* QR Code and Instructions */}
        <div className="p-6 flex flex-col items-center justify-center">
          <div className="rounded-2xl border border-primary/10 bg-white p-4.5 shadow-xs transition-all">
            <img
              src={activeGuestQr.qrCode}
              alt={`QR de ${activeGuestQr.name}`}
              className="h-44 w-44 rounded-xl object-contain bg-white p-1"
            />
          </div>
          <p className="mt-3.5 text-[10px] font-extrabold uppercase tracking-wider text-primary/75">
            {locale === "en" ? "Scan at the entrance" : "Escanea en el ingreso"}
          </p>

          <div className="mt-4.5 space-y-1">
            <span className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">
              {locale === "en" ? "Ticket Code:" : "Código de Entrada:"}
            </span>
            <p className="text-sm font-mono font-extrabold text-foreground tracking-wide select-all bg-secondary px-3 py-1 rounded-xl">
              {activeGuestQr.code}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-muted/20">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 px-4 rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-extrabold uppercase tracking-wider shadow-sm transition duration-250 cursor-pointer select-none"
          >
            {locale === "en" ? "Close" : "Cerrar"}
          </button>
        </div>
      </div>
    </div>
  );
}
