"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { QrCode, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useLocale, useTranslations } from "@/components/providers/LocaleProvider";
import { useHardwareScanner } from "@/hooks/useHardwareScanner";
import { parseTicketScanPayload } from "@/lib/tickets/parse-scan-payload";
import type { ScanResultData } from "./types";
import { HardwareScannerBanner } from "./HardwareScannerBanner";
import { CameraScannerSection } from "./CameraScannerSection";
import { ScanResultCard } from "./ScanResultCard";

export function QRScannerView() {
  const t = useTranslations();
  const { locale } = useLocale();
  const [showScanner, setShowScanner] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResultData | null>(null);
  const hardwareInputRef = useRef<HTMLInputElement | null>(null);
  const verifyingRef = useRef(false);

  const busy = loading || Boolean(result);
  const hardwareEnabled = !busy;

  const handleQRDetected = useCallback(
    async (detectedText: string) => {
      if (!detectedText || verifyingRef.current) return;
      verifyingRef.current = true;

      setLoading(true);
      setResult(null);
      setShowScanner(false);
      setCameraLoading(false);

      try {
        const { code, signature } = parseTicketScanPayload(detectedText);

        if (!code) {
          throw new Error(t("scanner.noValidCode"));
        }

        const response = await fetch("/api/tickets/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, signature }),
        });

        const data = await response.json();

        setResult({
          success: data.success,
          error: data.error,
          ticket: data.ticket,
          event: data.event,
        });

        if (data.success) {
          toast.success(t("scanner.successToast"));
        } else if (
          data.error === "Ticket not valid" ||
          data.status === "used" ||
          data.ticket?.status === "used"
        ) {
          toast.warning(t("scanner.alreadyUsedToast"));
        } else {
          toast.error(t("scanner.invalidToast", { error: data.error || "Código inválido" }));
        }
      } catch (err) {
        console.error(err);
        setResult({
          success: false,
          error: err instanceof Error ? err.message : t("scanner.processError"),
        });
        toast.error(t("scanner.processError"));
      } finally {
        verifyingRef.current = false;
        setLoading(false);
        if (hardwareInputRef.current) {
          hardwareInputRef.current.value = "";
        }
      }
    },
    [t],
  );

  useHardwareScanner({
    enabled: hardwareEnabled,
    onScan: handleQRDetected,
  });

  useEffect(() => {
    if (!hardwareEnabled) return;
    const focusInput = () => {
      const el = hardwareInputRef.current;
      if (!el) return;
      if (document.activeElement === el) return;
      const active = document.activeElement as HTMLElement | null;
      if (
        active &&
        (active.tagName === "INPUT" ||
          active.tagName === "TEXTAREA" ||
          active.tagName === "SELECT" ||
          active.isContentEditable) &&
        active.dataset.hardwareScanner !== "true"
      ) {
        return;
      }
      el.focus({ preventScroll: true });
    };

    focusInput();
    const id = window.setInterval(focusInput, 1500);
    return () => window.clearInterval(id);
  }, [hardwareEnabled, showScanner]);

  const handleCameraError = useCallback(() => {
    toast.error(t("scanner.cameraError"));
    setShowScanner(false);
    setCameraLoading(false);
  }, [t]);

  const resetScanner = () => {
    setResult(null);
    setCameraLoading(false);
    setShowScanner(false);
    requestAnimationFrame(() => hardwareInputRef.current?.focus({ preventScroll: true }));
  };

  const startScanner = () => {
    setResult(null);
    setCameraLoading(true);
    setShowScanner(true);
  };

  const stopScanner = () => {
    setShowScanner(false);
    setCameraLoading(false);
    requestAnimationFrame(() => hardwareInputRef.current?.focus({ preventScroll: true }));
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-6">
      <div className="fe-glass rounded-3xl p-6 border border-border/80 shadow-lg text-center space-y-6 overflow-hidden relative">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary/30 via-primary to-primary/30" />

        <div className="space-y-1.5">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-2">
            <QrCode className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-foreground">{t("scanner.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("scanner.subtitle")}</p>
        </div>

        {!busy && (
          <HardwareScannerBanner
            inputRef={hardwareInputRef}
            onManualScan={handleQRDetected}
          />
        )}

        {!result && !loading && (
          <CameraScannerSection
            showScanner={showScanner}
            cameraLoading={cameraLoading}
            loading={loading}
            onStartScanner={startScanner}
            onStopScanner={stopScanner}
            onDetected={handleQRDetected}
            onCameraError={handleCameraError}
            onScanStart={() => setCameraLoading(false)}
          />
        )}

        {loading && (
          <div className="py-12 flex flex-col items-center justify-center space-y-4">
            <RefreshCw className="h-10 w-10 text-primary animate-spin" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">{t("scanner.verifying")}</p>
              <p className="text-xs text-muted-foreground">{t("scanner.verifyingHelp")}</p>
            </div>
          </div>
        )}

        {result && (
          <ScanResultCard
            result={result}
            locale={locale}
            onReset={resetScanner}
          />
        )}
      </div>
    </div>
  );
}
