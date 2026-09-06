"use client";

import React from "react";
import { Award } from "lucide-react";
import type { UseFormRegister } from "react-hook-form";
import type { CreateEventInput } from "@/lib/validations";

interface EventCertificateSettingsProps {
  register: UseFormRegister<CreateEventInput>;
  hasCertificate?: boolean;
  locale: "es" | "en";
}

export function EventCertificateSettings({
  register,
  hasCertificate,
  locale,
}: EventCertificateSettingsProps) {
  return (
    <div className="rounded-xl border border-border/80 p-4 bg-background/60 space-y-3.5 transition-all">
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          {...register("hasCertificate")}
          className="mt-0.5 rounded border-border text-primary focus:ring-primary/20"
        />
        <div>
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold text-foreground">
              {locale === "en" ? "Include Digital Certificate" : "Incluir Certificado Digital"}
            </p>
            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold border border-primary/20">
              {locale === "en" ? "Optional" : "Opcional"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            {locale === "en"
              ? "Issues official downloadable certificate or attendance credential for attendees."
              : "Emite constancia o certificado oficial a participantes descargable por los asistentes."}
          </p>
        </div>
      </label>

      {hasCertificate && (
        <div className="pt-3 pl-7 border-t border-border/60 space-y-3">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-foreground">
              {locale === "en"
                ? "Certificate Title / Recognition (Optional)"
                : "Título de la Certificación o Reconocimiento (Opcional)"}
            </label>
            <input
              type="text"
              {...register("certificateTitle")}
              placeholder={
                locale === "en"
                  ? "e.g. Certificate of Participation"
                  : "Certificado de Participación"
              }
              className="w-full rounded-xl border border-border/80 bg-background px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 transition-all hover:border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              maxLength={120}
            />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {locale === "en"
                ? "Customize title shown on certificate and public page. If left blank, 'Certificado Digital de Participación' will be used."
                : "Personaliza el título que se mostrará en el certificado y página pública del evento. Si lo dejas vacío, se usará 'Certificado Digital de Participación'."}
            </p>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-foreground">
              {locale === "en"
                ? "Certificate Price (PEN) — Optional Add-on"
                : "Precio del Certificado (PEN) — Adición Opcional"}
            </label>
            <div className="relative flex items-center max-w-[200px]">
              <span className="absolute left-3 text-xs font-bold text-muted-foreground select-none">
                S/
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                {...register("certificatePrice", {
                  setValueAs: (v) => (v === "" || v === null ? 0 : Number(v)),
                })}
                placeholder="0.00"
                className="w-full rounded-xl border border-border/80 bg-background pl-8 pr-3 py-2 text-sm font-semibold text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {locale === "en"
                ? "If set to 0, certificate is free. If greater than 0, attendee can choose to add and pay during checkout."
                : "Si lo dejas en 0, el certificado estará incluido gratuitamente. Si colocas un monto (ej. S/ 15), el asistente podrá elegir solicitarlo y pagarlo al registrarse."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
