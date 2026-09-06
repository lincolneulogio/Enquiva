"use client";

import { Save, Loader2 } from "lucide-react";
import {
  ACCENT_COLORS,
  type AccentColor,
} from "@/components/dashboard/admin/AccentColorInitializer";

interface PlatformAccentSectionProps {
  locale: "es" | "en";
  platformAccentDraft: AccentColor;
  setPlatformAccentDraft: (val: AccentColor) => void;
  platformDefaultAccent?: AccentColor;
  isSaving: boolean;
  onSave: () => void;
}

export function PlatformAccentSection({
  locale,
  platformAccentDraft,
  setPlatformAccentDraft,
  platformDefaultAccent,
  isSaving,
  onSave,
}: PlatformAccentSectionProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-6 space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          {locale === "en"
            ? "Platform default accent"
            : "Color de acento por defecto (plataforma)"}
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          {locale === "en"
            ? "Applies to all users who have not chosen a personal accent. Saved in the database."
            : "Aplica a todos los usuarios que no hayan elegido un color personal. Se guarda en la base de datos."}
        </p>
      </div>

      <div className="flex flex-wrap gap-4 items-center">
        {(Object.keys(ACCENT_COLORS) as AccentColor[]).map((key) => {
          const config = ACCENT_COLORS[key];
          const isSelected = platformAccentDraft === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setPlatformAccentDraft(key)}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all duration-300 hover:scale-103 ${
                isSelected
                  ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary"
                  : "border-border bg-background hover:border-primary/50"
              }`}
            >
              <span
                className={`h-4.5 w-4.5 rounded-full shrink-0 flex items-center justify-center text-white text-[10px] font-bold ${config.class} shadow-inner`}
              >
                {isSelected && "✓"}
              </span>
              <span className="text-foreground text-xs font-semibold">{config.name}</span>
            </button>
          );
        })}
      </div>

      <div className="pt-1 flex justify-end">
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving || platformAccentDraft === platformDefaultAccent}
          className="w-full sm:w-auto justify-center flex items-center gap-2 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-semibold px-4 py-2 text-xs transition duration-200 disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          {locale === "en" ? "Save platform accent" : "Guardar acento de plataforma"}
        </button>
      </div>
    </div>
  );
}
