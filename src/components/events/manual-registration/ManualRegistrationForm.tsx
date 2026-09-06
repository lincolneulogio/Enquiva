"use client";

import React from "react";
import { User, FileText, Loader2 } from "lucide-react";

interface ManualRegistrationFormProps {
  events: Array<{ value: string; label: string }>;
  eventId: string;
  name: string;
  phone: string;
  notes: string;
  isPending: boolean;
  onFieldChange: (field: "eventId" | "name" | "phone" | "notes", value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export function ManualRegistrationForm({
  events,
  eventId,
  name,
  phone,
  notes,
  isPending,
  onFieldChange,
  onSubmit,
  onCancel,
}: ManualRegistrationFormProps) {
  return (
    <form onSubmit={onSubmit} className="p-6 space-y-4 text-left">
      {/* Event Selection */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-foreground uppercase tracking-wider block">
          Seleccionar Evento *
        </label>
        <select
          required
          value={eventId}
          onChange={(e) => onFieldChange("eventId", e.target.value)}
          className="w-full px-3 py-2 text-sm bg-card border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground font-medium"
        >
          <option value="" disabled>Selecciona un evento</option>
          {events.map((evt) => (
            <option key={evt.value} value={evt.value}>
              {evt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Attendee Name */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-foreground uppercase tracking-wider block">
          Nombre del Asistente *
        </label>
        <div className="relative flex items-center">
          <User className="absolute left-3.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            required
            placeholder="Nombre completo"
            value={name}
            onChange={(e) => onFieldChange("name", e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 text-sm bg-card border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground placeholder:text-muted-foreground/60 transition-all font-medium"
          />
        </div>
      </div>

      {/* Attendee Phone */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-foreground uppercase tracking-wider block">
          Teléfono de Contacto (Opcional)
        </label>
        <div className="relative flex items-center">
          <span className="absolute left-3.5 text-sm text-muted-foreground font-medium select-none pointer-events-none border-r border-border/80 pr-2.5">
            +51
          </span>
          <input
            type="tel"
            maxLength={9}
            placeholder="912345678"
            value={phone}
            onChange={(e) => {
              const onlyDigits = e.target.value.replace(/\D/g, "");
              if (onlyDigits.length <= 9) {
                onFieldChange("phone", onlyDigits);
              }
            }}
            style={{ paddingLeft: "54px" }}
            className={`w-full pr-3 py-2.5 text-sm bg-card border rounded-xl focus:outline-none focus:ring-2 transition-all duration-300 font-medium tracking-wide ${
              phone.length === 0
                ? "border-border focus:ring-primary/20 focus:border-primary"
                : phone.length < 9
                ? "border-amber-500/40 focus:ring-amber-500/20 focus:border-amber-500"
                : !phone.startsWith("9")
                ? "border-rose-500/40 focus:ring-rose-500/20 focus:border-rose-500"
                : "border-green-500/40 focus:ring-green-500/20 focus:border-green-500"
            }`}
          />
        </div>
        {phone.length > 0 && (
          <p className={`text-[10px] font-semibold transition-all duration-300 ${
            phone.length < 9
              ? "text-amber-500"
              : !phone.startsWith("9")
              ? "text-rose-500"
              : "text-green-500"
          }`}>
            {phone.length < 9
              ? `⚠️ Faltan ${9 - phone.length} dígitos para completar.`
              : !phone.startsWith("9")
              ? "❌ Debe iniciar con 9."
              : "✅ ¡Número válido!"}
          </p>
        )}
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-foreground uppercase tracking-wider block">
          Notas de Inscripción (Opcional)
        </label>
        <div className="relative flex items-start">
          <FileText className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
          <textarea
            rows={2}
            placeholder="Detalles del pago en efectivo u observaciones..."
            value={notes}
            onChange={(e) => onFieldChange("notes", e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 text-sm bg-card border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground placeholder:text-muted-foreground/60 transition-all font-medium resize-none"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="pt-4 border-t border-border flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 px-4 rounded-xl border border-border hover:bg-muted text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          disabled={isPending}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 py-2.5 px-4 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Registrar Pago"
          )}
        </button>
      </div>
    </form>
  );
}
