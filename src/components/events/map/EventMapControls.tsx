"use client";

import {
  Crosshair,
  ExternalLink,
  Loader2,
  LocateFixed,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EventMapControlsProps {
  tracking: boolean;
  followMe: boolean;
  directionsBusy: boolean;
  distanceLabel: string | null;
  onStartTracking: (opts?: { follow?: boolean }) => void;
  onStopTracking: () => void;
  onToggleFollow: () => void;
  onCenterEvent: () => void;
  onOpenDirections: () => void;
}

export function EventMapControls({
  tracking,
  followMe,
  directionsBusy,
  distanceLabel,
  onStartTracking,
  onStopTracking,
  onToggleFollow,
  onCenterEvent,
  onOpenDirections,
}: EventMapControlsProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <MapPin className="h-3.5 w-3.5" />
        </span>
        <h4 className="text-sm font-bold text-foreground">Mapa del lugar</h4>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {!tracking ? (
          <button
            type="button"
            onClick={() => onStartTracking()}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground shadow-2xs hover:bg-primary/90 transition-colors cursor-pointer"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
            Mi ubicación en vivo
          </button>
        ) : (
          <button
            type="button"
            onClick={onStopTracking}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted cursor-pointer"
          >
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
            Detener
          </button>
        )}

        <button
          type="button"
          onClick={onToggleFollow}
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer",
            followMe
              ? "border-primary bg-primary/10 text-primary"
              : "border-border/80 bg-white dark:bg-card text-foreground/80 hover:bg-muted",
          )}
        >
          <LocateFixed className="h-3 w-3" />
          {followMe ? "Siguiéndote…" : "Seguirme"}
        </button>

        <button
          type="button"
          onClick={onCenterEvent}
          className="inline-flex items-center gap-1 rounded-full border border-border/80 bg-white dark:bg-card px-3 py-1.5 text-xs font-medium text-foreground/80 hover:bg-muted transition-colors cursor-pointer"
        >
          <Crosshair className="h-3 w-3" />
          Centrar evento
        </button>

        <button
          type="button"
          onClick={onOpenDirections}
          disabled={directionsBusy}
          className="inline-flex items-center gap-1 rounded-full border border-border/80 bg-white dark:bg-card px-3 py-1.5 text-xs font-medium text-foreground/80 hover:bg-muted transition-colors cursor-pointer disabled:opacity-60"
        >
          {directionsBusy ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <ExternalLink className="h-3 w-3" />
          )}
          Cómo llegar
        </button>

        {distanceLabel && (
          <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
            A {distanceLabel}
          </span>
        )}
      </div>
    </div>
  );
}
