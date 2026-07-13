"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  Scanner,
  type IDetectedBarcode,
  type IScannerHandle,
} from "@yudiel/react-qr-scanner";

interface QRScannerProps {
  onResult: (code: string) => void;
  onError?: (error: unknown) => void;
  onScanStart?: () => void;
  paused?: boolean;
}

export default function QRScanner({
  onResult,
  onError,
  onScanStart,
  paused = false,
}: QRScannerProps) {
  const scannerRef = useRef<IScannerHandle>(null);
  const lastValueRef = useRef<string | null>(null);
  const lastAtRef = useRef(0);
  const startedRef = useRef(false);
  const onScanStartRef = useRef(onScanStart);

  useEffect(() => {
    onScanStartRef.current = onScanStart;
  });

  useEffect(() => {
    startedRef.current = false;
    const poll = window.setInterval(() => {
      const video = scannerRef.current?.getVideoElement();
      if (video && !video.paused && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        if (!startedRef.current) {
          startedRef.current = true;
          onScanStartRef.current?.();
        }
        window.clearInterval(poll);
      }
    }, 200);

    const fallback = window.setTimeout(() => {
      if (!startedRef.current) {
        startedRef.current = true;
        onScanStartRef.current?.();
      }
      window.clearInterval(poll);
    }, 2500);

    return () => {
      window.clearInterval(poll);
      window.clearTimeout(fallback);
    };
  }, []);

  const handleScan = useCallback(
    (detectedCodes: IDetectedBarcode[]) => {
      if (!startedRef.current) {
        startedRef.current = true;
        onScanStartRef.current?.();
      }

      const raw = detectedCodes[0]?.rawValue?.trim();
      if (!raw) return;

      const now = Date.now();
      if (raw === lastValueRef.current && now - lastAtRef.current < 2500) {
        return;
      }
      lastValueRef.current = raw;
      lastAtRef.current = now;
      onResult(raw);
    },
    [onResult],
  );

  return (
    <div className="absolute inset-0 h-full w-full overflow-hidden bg-black [&_video]:h-full [&_video]:w-full [&_video]:object-cover">
      <Scanner
        ref={scannerRef}
        onScan={handleScan}
        onError={onError}
        paused={paused}
        formats={["qr_code"]}
        sound={false}
        scanDelay={1200}
        startTimeoutMs={8000}
        constraints={{
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        }}
        styles={{
          container: {
            width: "100%",
            height: "100%",
            paddingTop: 0,
            borderRadius: 0,
            overflow: "hidden",
            background: "#000",
          },
          video: {
            width: "100%",
            height: "100%",
            objectFit: "cover",
          },
        }}
        components={{
          finder: false,
          torch: false,
          zoom: false,
          onOff: false,
        }}
      />
    </div>
  );
}
