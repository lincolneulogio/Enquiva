"use client";

import { MapPin, Users, Ticket, Check, Award } from "lucide-react";
import { cn } from "@/lib/utils";

interface EventDetailMetricsProps {
  locationName: string;
  locationAddress: string;
  occupied: number;
  capacity: number | null;
  price: string | number | null;
  currency?: string;
  isVirtual?: boolean;
  hasCertificate?: boolean;
  certificateTitle?: string | null;
}

export function EventDetailMetrics({
  locationName,
  locationAddress,
  occupied,
  capacity,
  price,
  currency = "PEN",
  isVirtual = false,
  hasCertificate = false,
  certificateTitle,
}: EventDetailMetricsProps) {
  const maxCapacity = capacity && capacity > 0 ? capacity : 10;
  const available = Math.max(0, maxCapacity - occupied);
  const percentage = Math.min(100, Math.round((occupied / maxCapacity) * 100));

  const parsedPrice = price != null ? Number(price) : 1;
  const formattedPrice =
    parsedPrice > 0 ? `S/${parsedPrice.toFixed(2)}` : "Gratis";

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
      {/* 1. UBICACIÓN */}
      <div className="rounded-2xl border border-border/80 bg-white dark:bg-card p-4 sm:p-5 flex flex-col justify-between gap-3 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <MapPin className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              UBICACIÓN
            </span>
          </div>

          <h4 className="text-sm sm:text-base font-bold text-foreground leading-tight">
            {locationName}
          </h4>
          <p className="text-xs text-muted-foreground mt-1 leading-snug">
            {locationAddress}
          </p>
        </div>

        <div className="pt-2 border-t border-border/50">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            {isVirtual ? "Evento 100% Online" : "Sede presencial oficial"}
          </span>
        </div>
      </div>

      {/* 2. CAPACIDAD */}
      <div className="rounded-2xl border border-border/80 bg-white dark:bg-card p-4 sm:p-5 flex flex-col justify-between gap-3 shadow-xs">
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <Users className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                CAPACIDAD
              </span>
            </div>
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-primary border border-primary/25">
              {available} disponibles
            </span>
          </div>

          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl sm:text-2xl font-black text-foreground">
              {occupied}
            </span>
            <span className="text-sm font-semibold text-muted-foreground">
              / {maxCapacity}
            </span>
          </div>

          {/* Barra de progreso de cupos */}
          <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-primary/15 dark:bg-primary/20">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                percentage >= 100
                  ? "bg-destructive"
                  : "bg-primary shadow-2xs shadow-primary/30"
              )}
              style={{ width: `${Math.min(100, Math.max(6, percentage))}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/50 font-medium">
          <span>Ocupación actual</span>
          <span className="font-bold text-foreground">{percentage}%</span>
        </div>
      </div>

      {/* 3. COSTO DE ENTRADA */}
      <div className="rounded-2xl border border-border/80 bg-white dark:bg-card p-4 sm:p-5 flex flex-col justify-between gap-3 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400">
              <Ticket className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              COSTO DE ENTRADA
            </span>
          </div>

          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-xl sm:text-2xl font-black text-primary">
              {formattedPrice}
            </span>
            <span className="text-xs font-bold uppercase text-muted-foreground">
              {currency}
            </span>
          </div>

          <p className="text-xs text-muted-foreground mt-1 leading-snug">
            Acceso completo a conferencias y talleres
          </p>
        </div>

        <div className="pt-2 border-t border-border/50">
          {hasCertificate ? (
            <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 border border-emerald-200/40">
              <Award className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span className="truncate">{certificateTitle || "Incluye certificado digital"}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 rounded-lg bg-muted/40 px-2.5 py-1 text-[11px] font-medium text-muted-foreground border border-border/40">
              <Check className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
              <span>Entrada y acceso oficial</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
