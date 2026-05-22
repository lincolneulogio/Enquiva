"use client";

import { useEffect, useRef } from "react";
import { BrowserMultiFormatReader } from "@zxing/library";

interface QRScannerProps {
  onResult: (code: string) => void;
  onError?: (error: any) => void;
  onScanStart?: () => void;
}

export default function QRScanner({ onResult, onError, onScanStart }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);

  useEffect(() => {
    let active = true;
    const codeReader = new BrowserMultiFormatReader();
    readerRef.current = codeReader;

    async function startScanning() {
      try {
        await codeReader.decodeFromVideoDevice(null, videoRef.current, (result, error) => {
          if (!active) return;
          if (result?.getText()) {
            onResult(result.getText());
            return;
          }
          if (error && !(error.name === "NotFoundException")) {
            // zxing constantly throws NotFoundException while looking for code, which is normal.
            console.debug(error);
          }
        });
        if (active && onScanStart) {
          onScanStart();
        }
      } catch (err) {
        console.error("Error starting QR scanner:", err);
        if (active && onError) {
          onError(err);
        }
      }
    }

    startScanning();

    return () => {
      active = false;
      if (readerRef.current) {
        readerRef.current.reset();
      }
    };
  }, [onResult, onError, onScanStart]);

  return (
    <video
      ref={videoRef}
      className="w-full h-full object-cover"
      playsInline
      muted
    />
  );
}
