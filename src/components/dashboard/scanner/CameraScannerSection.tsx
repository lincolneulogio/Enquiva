"use client";

import dynamic from "next/dynamic";
import { Camera, CameraOff, RefreshCw } from "lucide-react";
import { useTranslations } from "@/components/providers/LocaleProvider";

const QRScanner = dynamic(() => import("./QRScanner"), { ssr: false });

interface CameraScannerSectionProps {
  showScanner: boolean;
  cameraLoading: boolean;
  loading: boolean;
  onStartScanner: () => void;
  onStopScanner: () => void;
  onDetected: (text: string) => void;
  onCameraError: () => void;
  onScanStart: () => void;
}

export function CameraScannerSection({
  showScanner,
  cameraLoading,
  loading,
  onStartScanner,
  onStopScanner,
  onDetected,
  onCameraError,
  onScanStart,
}: CameraScannerSectionProps) {
  const t = useTranslations();

  return (
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
              onResult={onDetected}
              onError={onCameraError}
              onScanStart={onScanStart}
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
            onClick={onStopScanner}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors cursor-pointer"
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
            onClick={onStartScanner}
            className="fe-btn-glow inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all duration-300 cursor-pointer"
          >
            <Camera className="h-4 w-4" />
            {t("scanner.turnOnCamera")}
          </button>
        </div>
      )}
    </div>
  );
}
