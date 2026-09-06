"use client";

import { Check, Pencil } from "lucide-react";
import type { NearbyPoi } from "@/lib/geo/nominatim";

interface LocationConfirmBannerProps {
  address: string;
  nearbyPoi: NearbyPoi | null;
  confirmOpen: boolean;
  addressConfirmed: boolean;
  onConfirm: () => void;
  onEditAddress?: () => void;
}

export function LocationConfirmBanner({
  address,
  nearbyPoi,
  confirmOpen,
  addressConfirmed,
  onConfirm,
  onEditAddress,
}: LocationConfirmBannerProps) {
  return (
    <>
      {confirmOpen && address.trim() && !addressConfirmed && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold text-foreground">
              ¿Es correcta esta ubicación?
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onConfirm}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
              >
                <Check className="h-3.5 w-3.5" />
                Sí, es correcto
              </button>
              <button
                type="button"
                onClick={onEditAddress}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
              >
                <Pencil className="h-3.5 w-3.5" />
                Editar dirección
              </button>
            </div>
          </div>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            {address}
            {nearbyPoi ? (
              <>
                {" "}
                · Lugar detectado: <strong className="text-foreground">{nearbyPoi.name}</strong>
                {nearbyPoi.distanceM > 0
                  ? ` (~${Math.round(nearbyPoi.distanceM)} m)`
                  : ""}
              </>
            ) : null}
          </p>
        </div>
      )}

      {addressConfirmed && (
        <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
          Dirección confirmada. Puedes seguir editándola si hace falta.
        </p>
      )}
    </>
  );
}
