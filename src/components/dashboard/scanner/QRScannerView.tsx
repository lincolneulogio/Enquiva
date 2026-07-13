"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  Camera,
  CameraOff,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Calendar,
  Clock,
  QrCode,
  ScanBarcode,
  Keyboard,
} from "lucide-react";
import { toast } from "sonner";
import { useLocale, useTranslations } from "@/components/providers/LocaleProvider";
import { useHardwareScanner } from "@/hooks/useHardwareScanner";
import { parseTicketScanPayload } from "@/lib/tickets/parse-scan-payload";

const QRScanner = dynamic(() => import("./QRScanner"), { ssr: false });

interface ScanResultData {
  success: boolean;
  error?: string;
  ticket?: {
    code: string;
    status: string;
    checkedInAt?: string | null;
  };
  event?: {
    title: string;
  };
}

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
      // Don't steal focus from another intentional input on the page
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

  const handleScanStart = useCallback(() => {
    setCameraLoading(false);
  }, []);

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

        {/* Hardware USB/Bluetooth wedge — always ready while idle */}
        {!busy && (
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
                ref={hardwareInputRef}
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
                    void handleQRDetected(text);
                  }
                }}
              />
            </div>
          </div>
        )}

        {!result && !loading && (
          <div className="relative space-y-3">
            <div className="flex items-center gap-2 text-left">
              <Camera className="h-4 w-4 text-primary shrink-0" />
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("scanner.cameraMode")}
              </p>
            </div>

            {showScanner ? (
              <div className="space-y-4">
                <div className="relative rounded-2xl overflow-hidden border border-primary/20 bg-black aspect-video max-h-72 mx-auto">
                  {cameraLoading && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/85 backdrop-blur-sm space-y-4 animate-in fade-in duration-300">
                      <div className="relative flex items-center justify-center">
                        <RefreshCw className="h-10 w-10 text-primary animate-spin" />
                        <Camera className="h-4 w-4 text-primary absolute animate-pulse" />
                      </div>
                      <p className="text-sm font-semibold text-white/90 tracking-wide animate-pulse">
                        {t("scanner.cameraStarting")}
                      </p>
                    </div>
                  )}

                  <QRScanner
                    onResult={handleQRDetected}
                    onError={handleCameraError}
                    onScanStart={handleScanStart}
                    paused={loading}
                  />

                  <div className="absolute inset-0 z-10 pointer-events-none border-[16px] border-black/40 flex items-center justify-center">
                    <div className="w-40 h-40 border-2 border-dashed border-primary/60 rounded-xl relative">
                      <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-primary" />
                      <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-primary" />
                      <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-primary" />
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-primary" />
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={stopScanner}
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                >
                  <CameraOff className="h-4 w-4" />
                  {t("scanner.turnOffCamera")}
                </button>
              </div>
            ) : (
              <div className="py-6 px-4 rounded-2xl border border-dashed border-border bg-muted/40 flex flex-col items-center justify-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-background flex items-center justify-center border text-muted-foreground shadow-sm">
                  <Camera className="h-7 w-7" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">{t("scanner.cameraOff")}</p>
                  <p className="text-xs text-muted-foreground">{t("scanner.cameraOffHelp")}</p>
                </div>
                <button
                  type="button"
                  onClick={startScanner}
                  className="fe-btn-glow inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all duration-300"
                >
                  <Camera className="h-4 w-4" />
                  {t("scanner.turnOnCamera")}
                </button>
              </div>
            )}
          </div>
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
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
            {result.success && (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 text-center space-y-4">
                <div className="mx-auto w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                  <CheckCircle2 className="h-9 w-9" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-emerald-600">{t("scanner.accessGranted")}</h3>
                  <p className="text-xs text-muted-foreground">{t("scanner.accessGrantedHelp")}</p>
                </div>

                <div className="border-t border-border/60 pt-4 text-left space-y-2.5 text-sm">
                  {result.event && (
                    <div className="flex items-center gap-2 text-foreground font-medium">
                      <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span>{result.event.title}</span>
                    </div>
                  )}
                  {result.ticket && (
                    <div className="flex items-center justify-between text-xs text-muted-foreground bg-background/50 p-2 rounded-lg border">
                      <span>{t("scanner.ticketCode")}</span>
                      <span className="font-mono font-bold text-foreground">{result.ticket.code}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {!result.success &&
              (result.error === "Ticket not valid" || result.ticket?.status === "used") && (
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 text-center space-y-4">
                  <div className="mx-auto w-14 h-14 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                    <AlertTriangle className="h-9 w-9" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-amber-600">{t("scanner.ticketUsed")}</h3>
                    <p className="text-xs text-muted-foreground">{t("scanner.ticketUsedHelp")}</p>
                  </div>

                  <div className="border-t border-border/60 pt-4 text-left space-y-2.5 text-sm">
                    {result.ticket?.checkedInAt && (
                      <div className="flex items-center gap-2 text-foreground font-medium">
                        <Clock className="h-4 w-4 shrink-0 text-amber-500" />
                        <span>
                          {t("scanner.firstCheckin", {
                            time: new Date(result.ticket.checkedInAt).toLocaleString(
                              locale === "en" ? "en-US" : "es-PE",
                              { dateStyle: "short", timeStyle: "medium" },
                            ),
                          })}
                        </span>
                      </div>
                    )}
                    {result.ticket && (
                      <div className="flex items-center justify-between text-xs text-muted-foreground bg-background/50 p-2 rounded-lg border">
                        <span>{t("scanner.ticketCode")}</span>
                        <span className="font-mono font-bold text-foreground">{result.ticket.code}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

            {!result.success &&
              result.error !== "Ticket not valid" &&
              result.ticket?.status !== "used" && (
                <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-5 text-center space-y-4">
                  <div className="mx-auto w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
                    <XCircle className="h-9 w-9" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-destructive">{t("scanner.accessDenied")}</h3>
                    <p className="text-xs text-muted-foreground">{t("scanner.accessDeniedHelp")}</p>
                  </div>

                  <div className="border-t border-border/60 pt-4 text-left p-3 bg-destructive/5 rounded-xl border border-destructive/10">
                    <p className="text-xs font-semibold text-destructive uppercase tracking-wider mb-1">
                      {t("scanner.errorDetail")}
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {result.error || t("scanner.accessDeniedHelp")}
                    </p>
                  </div>
                </div>
              )}

            <button
              type="button"
              onClick={resetScanner}
              className="fe-btn-glow inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all duration-300"
            >
              <RefreshCw className="h-4 w-4" />
              {t("scanner.scanAnother")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
