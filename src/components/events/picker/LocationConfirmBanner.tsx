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
          <p className="text-xs font-medium text-foreground">
            ¿Es correcta esta ubicación?
          </p>
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
          <p className="text-[10px] text-muted-foreground">
            Los datos vienen de OpenStreetMap; en Perú a veces falta el número o el nombre del local. Puedes editar el texto a mano.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onConfirm}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
            >
              <Check className="h-3.5 w-3.5" />
              Sí, es correcto
            </button>
            <button
              type="button"
              onClick={onEditAddress}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
            >
              <Pencil className="h-3.5 w-3.5" />
              Editar dirección
            </button>
          </div>
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
