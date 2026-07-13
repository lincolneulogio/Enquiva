"use client";

import { useEffect, useRef } from "react";

interface UseHardwareScannerOptions {
  /** When false, ignore all keystrokes. */
  enabled: boolean;
  onScan: (raw: string) => void;
  /** Max gap between keystrokes to treat as one scanner burst (ms). */
  maxKeyGapMs?: number;
  /** Minimum payload length before accepting Enter. */
  minLength?: number;
}

/**
 * Captures USB/Bluetooth QR scanners that act as keyboard wedges
 * (rapid keystrokes ending with Enter).
 */
export function useHardwareScanner({
  enabled,
  onScan,
  maxKeyGapMs = 80,
  minLength = 4,
}: UseHardwareScannerOptions) {
  const onScanRef = useRef(onScan);
  const bufferRef = useRef("");
  const lastKeyAtRef = useRef(0);

  useEffect(() => {
    onScanRef.current = onScan;
  });

  useEffect(() => {
    if (!enabled) {
      bufferRef.current = "";
      return;
    }

    const shouldIgnoreTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false;
      if (target.dataset.hardwareScanner === "true") return false;
      const tag = target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
      if (target.isContentEditable) return true;
      return false;
    };

    const flush = () => {
      const value = bufferRef.current.trim();
      bufferRef.current = "";
      if (value.length >= minLength) {
        onScanRef.current(value);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (!enabled) return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (shouldIgnoreTarget(event.target)) return;

      const now = Date.now();
      if (now - lastKeyAtRef.current > maxKeyGapMs) {
        bufferRef.current = "";
      }
      lastKeyAtRef.current = now;

      if (event.key === "Enter") {
        if (bufferRef.current.length >= minLength) {
          event.preventDefault();
          event.stopImmediatePropagation();
          flush();
        } else if (
          event.target instanceof HTMLInputElement &&
          event.target.dataset.hardwareScanner === "true"
        ) {
          const value = event.target.value.trim();
          if (value.length >= minLength) {
            event.preventDefault();
            event.stopImmediatePropagation();
            bufferRef.current = "";
            onScanRef.current(value);
            event.target.value = "";
          }
        } else {
          bufferRef.current = "";
        }
        return;
      }

      if (event.key === "Escape") {
        bufferRef.current = "";
        return;
      }

      if (event.key.length === 1) {
        bufferRef.current += event.key;
      }
    };

    window.addEventListener("keydown", onKeyDown, true);
    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      bufferRef.current = "";
    };
  }, [enabled, maxKeyGapMs, minLength]);
}
