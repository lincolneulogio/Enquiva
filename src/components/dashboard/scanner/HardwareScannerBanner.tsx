"use client";

import { ScanBarcode, Keyboard } from "lucide-react";
import { useTranslations } from "@/components/providers/LocaleProvider";

interface HardwareScannerBannerProps {
  inputRef: React.RefObject<HTMLInputElement | null>;
  onManualScan: (code: string) => void;
}

export function HardwareScannerBanner({
  inputRef,
  onManualScan,
}: HardwareScannerBannerProps) {
  const t = useTranslations();

  return (
    <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-4 text-left space-y-3">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-600 dark:text-emerald-400 shrink-0">
          <ScanBarcode className="h-5 w-5" />
        </div>
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-bold text-foreground flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            {t("scanner.hardwareReady")}
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t("scanner.hardwareHelp")}
          </p>
        </div>
      </div>

      <div className="relative">
        <Keyboard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          ref={inputRef}
          data-hardware-scanner="true"
          type="text"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          inputMode="none"
          aria-label={t("scanner.hardwareInputLabel")}
          placeholder={t("scanner.hardwarePlaceholder")}
          className="w-full rounded-xl border border-border bg-background pl-10 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50"
          onPaste={(e) => {
            const text = e.clipboardData.getData("text").trim();
            if (text.length >= 4) {
              e.preventDefault();
              onManualScan(text);
            }
          }}
        />
      </div>
    </div>
  );
}
