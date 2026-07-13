"use client";

import { useEffect, useRef } from "react";
import {
  BarcodeFormat,
  BrowserMultiFormatReader,
  DecodeHintType,
} from "@zxing/library";

interface QRScannerProps {
  onResult: (code: string) => void;
  onError?: (error: unknown) => void;
  onScanStart?: () => void;
}

function isBenignScanMiss(error: unknown): boolean {
  if (!error) return true;
  const message =
    error instanceof Error
      ? `${error.name} ${error.message}`
      : String(error);
  const kind =
    typeof error === "object" &&
    error !== null &&
    "getKind" in error &&
    typeof (error as { getKind: () => string }).getKind === "function"
      ? (error as { getKind: () => string }).getKind()
      : "";

  return (
    kind === "NotFoundException" ||
    kind === "ChecksumException" ||
    kind === "FormatException" ||
    /NotFoundException|ChecksumException|FormatException|No MultiFormat Readers|No barcode/i.test(
      message,
    )
  );
}

async function openCameraStream(): Promise<MediaStream> {
  const attempts: MediaStreamConstraints[] = [
    {
      audio: false,
      video: {
        facingMode: { ideal: "environment" },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    },
    {
      audio: false,
      video: {
        facingMode: "user",
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    },
    { audio: false, video: true },
  ];

  let lastError: unknown;
  for (const constraints of attempts) {
    try {
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError ?? new Error("No se pudo acceder a la cámara");
}

export default function QRScanner({ onResult, onError, onScanStart }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const onResultRef = useRef(onResult);
  const onErrorRef = useRef(onError);
  const onScanStartRef = useRef(onScanStart);
  const lastCodeRef = useRef<string | null>(null);
  const lastScanAtRef = useRef(0);

  useEffect(() => {
    onResultRef.current = onResult;
    onErrorRef.current = onError;
    onScanStartRef.current = onScanStart;
  });

  useEffect(() => {
    let active = true;
    let stream: MediaStream | null = null;
    let scanTimer: number | undefined;
    const videoEl = videoRef.current;
    if (!videoEl) return;

    if (!navigator.mediaDevices?.getUserMedia) {
      onErrorRef.current?.(new Error("Este navegador no soporta acceso a cámara"));
      return;
    }

    const hints = new Map<DecodeHintType, unknown>();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE]);
    hints.set(DecodeHintType.TRY_HARDER, true);
    const codeReader = new BrowserMultiFormatReader(hints, 300);

    const stopTracks = () => {
      if (!stream) return;
      stream.getTracks().forEach((track) => track.stop());
      stream = null;
      if (videoEl.srcObject) videoEl.srcObject = null;
    };

    const scanFrame = () => {
      if (!active || !videoEl) return;
      if (videoEl.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || videoEl.videoWidth === 0) {
        return;
      }
      try {
        const result = codeReader.decode(videoEl);
        const text = result?.getText()?.trim();
        if (text) {
          const now = Date.now();
          // Avoid firing the same code repeatedly while held in front of the camera.
          if (text !== lastCodeRef.current || now - lastScanAtRef.current > 2500) {
            lastCodeRef.current = text;
            lastScanAtRef.current = now;
            onResultRef.current(text);
          }
        }
      } catch (error) {
        if (!isBenignScanMiss(error)) {
          console.debug("[scanner] decode miss:", error);
        }
      }
    };

    async function start() {
      try {
        stream = await openCameraStream();
        if (!active || !videoEl) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        const video = videoEl;
        video.srcObject = stream;
        video.setAttribute("playsinline", "true");
        video.muted = true;
        await video.play();

        if (!active) {
          stopTracks();
          return;
        }

        onScanStartRef.current?.();
        scanTimer = window.setInterval(scanFrame, 280);
      } catch (err) {
        console.error("Error starting QR scanner:", err);
        if (active) onErrorRef.current?.(err);
      }
    }

    void start();

    return () => {
      active = false;
      if (scanTimer) window.clearInterval(scanTimer);
      stopTracks();
      try {
        codeReader.reset();
      } catch {
        /* ignore */
      }
    };
  }, []);

  return (
    <video
      ref={videoRef}
      className="absolute inset-0 h-full w-full object-cover bg-black"
      playsInline
      muted
      autoPlay
    />
  );
}
