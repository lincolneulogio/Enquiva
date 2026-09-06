"use client";

import React from "react";
import { ShieldCheck, MessageCircle, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface EventOrganizerCardProps {
  organizerName: string;
  organizerDescription: string;
  waContactUrl?: string | null;
}

export function EventOrganizerCard({
  organizerName,
  organizerDescription,
  waContactUrl,
}: EventOrganizerCardProps) {
  return (
    <div className="rounded-2xl border border-border/80 bg-white dark:bg-card p-4 sm:p-5 shadow-xs space-y-3">
      <div className="flex items-start gap-3.5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div className="space-y-0.5 min-w-0 flex-1">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            ORGANIZADOR
          </span>
          <h4 className="text-sm sm:text-base font-bold text-foreground truncate">
            {organizerName}
          </h4>
          <p className="text-xs text-muted-foreground leading-snug">
            {organizerDescription}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs font-medium">
        {waContactUrl ? (
          <a
            href={waContactUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-semibold transition-colors"
          >
            <MessageCircle className="h-3.5 w-3.5 text-emerald-500" />
            <span>Contactar organizador</span>
            <ExternalLink className="h-3 w-3 opacity-70" />
          </a>
        ) : (
          <button
            type="button"
            onClick={() =>
              toast.info("El organizador aún no ha registrado un número de WhatsApp para contacto directo.")
            }
            className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground font-medium transition-colors"
          >
            <MessageCircle className="h-3.5 w-3.5 opacity-60" />
            <span>Contactar organizador</span>
          </button>
        )}

        <span className="inline-flex items-center rounded-full bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-200/50">
          Verificado
        </span>
      </div>
    </div>
  );
}
