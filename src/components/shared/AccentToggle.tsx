"use client";

import { useEffect, useRef, useState } from "react";
import { Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/components/providers/LocaleProvider";
import {
  ACCENT_COLORS,
  DEFAULT_ACCENT_COLOR,
  isAccentColor,
  setAccentOverride,
  type AccentColor,
} from "@/lib/brand/accent";

const ACCENT_ORDER: AccentColor[] = ["amber", "emerald", "rose", "blue"];

const ACCENT_LABEL_KEYS: Record<AccentColor, string> = {
  amber: "common.accentAmber",
  emerald: "common.accentEmerald",
  rose: "common.accentRose",
  blue: "common.accentBlue",
};

interface AccentToggleProps {
  className?: string;
}

function readActiveAccent(): AccentColor {
  if (typeof document === "undefined") return DEFAULT_ACCENT_COLOR;
  const fromDom = document.documentElement.dataset.accent;
  return isAccentColor(fromDom) ? fromDom : DEFAULT_ACCENT_COLOR;
}

export function AccentToggle({ className }: AccentToggleProps) {
  const t = useTranslations();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<AccentColor>(DEFAULT_ACCENT_COLOR);

  useEffect(() => {
    setMounted(true);
    const sync = () => setActive(readActiveAccent());
    sync();
    window.addEventListener("brand-accent-changed", sync);
    return () => window.removeEventListener("brand-accent-changed", sync);
  }, []);

  useEffect(() => {
    if (!open) return;

    const handleOutsideClick = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const label = t("common.accent");

  const handleSelect = (color: AccentColor) => {
    setAccentOverride(color);
    setActive(color);
    setOpen(false);
  };

  return (
    <div ref={menuRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => mounted && setOpen((current) => !current)}
        title={label}
        aria-label={label}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={cn(
          "inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-border bg-secondary/50 px-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground sm:px-3",
          className,
        )}
      >
        <span
          className={cn(
            "h-3.5 w-3.5 shrink-0 rounded-full shadow-inner ring-1 ring-foreground/15",
            mounted ? ACCENT_COLORS[active].class : "bg-muted",
          )}
          aria-hidden
        />
        <Palette className="hidden h-4 w-4 sm:inline" />
        <span className="hidden lg:inline">{label}</span>
      </button>

      {open ? (
        <div
          role="listbox"
          aria-label={label}
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-52 rounded-xl border border-border bg-background p-1.5 shadow-xl"
        >
          {ACCENT_ORDER.map((color) => {
            const selected = mounted && active === color;
            return (
              <button
                key={color}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => handleSelect(color)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
                  selected
                    ? "bg-primary/10 font-medium text-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "h-4 w-4 shrink-0 rounded-full shadow-inner ring-1 ring-foreground/15",
                    ACCENT_COLORS[color].class,
                  )}
                />
                <span className="flex-1 truncate">{t(ACCENT_LABEL_KEYS[color])}</span>
                {selected ? (
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
