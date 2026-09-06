"use client";

import React from "react";
import { Award, Check } from "lucide-react";

interface CertificateSelectionSectionProps {
  hasCertificate: boolean;
  certificateTitle?: string | null;
  certificatePrice?: number | null;
  wantsCertificate: boolean;
  onToggleCertificate: () => void;
}

export function CertificateSelectionSection({
  hasCertificate,
  certificateTitle,
  certificatePrice,
  wantsCertificate,
  onToggleCertificate,
}: CertificateSelectionSectionProps) {
  if (!hasCertificate) return null;

  return (
    <div className="space-y-3 pt-1">
      <div className="space-y-1 text-left">
        <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <Award className="h-4 w-4 text-primary" />
          Certificación Oficial de Participación
        </label>
        <p className="text-xs text-muted-foreground leading-relaxed">
          El organizador ofrece un certificado oficial verificable con código QR único anti-fraude.
        </p>
      </div>

      <div
        onClick={onToggleCertificate}
        className={`group cursor-pointer rounded-2xl border p-4 transition-all duration-200 text-left flex items-center justify-between gap-3 ${
          wantsCertificate
            ? "border-primary bg-primary/10 dark:bg-primary/20 ring-2 ring-primary shadow-sm"
            : "border-border bg-card hover:border-primary/40 hover:bg-muted/40"
        }`}
      >
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-foreground">
              {certificateTitle || "Certificado Oficial de Aprobación / Asistencia"}
            </span>
            {wantsCertificate && (
              <span className="rounded-full bg-primary/15 text-primary text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider border border-primary/20">
                Añadido
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {Number(certificatePrice) > 0
              ? `Add-on opcional de certificación: S/ ${Number(certificatePrice).toFixed(2)}`
              : "Incluido sin costo adicional con tu inscripción"}
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-2.5">
          <span className="text-xs font-bold text-primary">
            {Number(certificatePrice) > 0
              ? `+ S/ ${Number(certificatePrice).toFixed(2)}`
              : "Gratis"}
          </span>
          <div
            className={`h-5 w-5 rounded-md border flex items-center justify-center transition-colors ${
              wantsCertificate
                ? "bg-primary border-primary text-primary-foreground"
                : "border-muted-foreground/30 bg-background"
            }`}
          >
            {wantsCertificate && <Check className="h-3.5 w-3.5 stroke-[3]" />}
          </div>
        </div>
      </div>
    </div>
  );
}
