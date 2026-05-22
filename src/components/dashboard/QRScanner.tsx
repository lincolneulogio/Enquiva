"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/library";

export default function QRScanner({ onResult }: { onResult: (code: string) => void }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [scanning, setScanning] = useState(false);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);

  useEffect(() => {
    return () => {
      if (readerRef.current) {
        readerRef.current.reset();
      }
    };
  }, []);

  async function start() {
    try {
      const codeReader = new BrowserMultiFormatReader();
      readerRef.current = codeReader;
      setScanning(true);

      await codeReader.decodeFromVideoDevice(null, videoRef.current, (result, error) => {
        if (result?.getText()) {
          onResult(result.getText());
          stop();
          return;
        }

        if (error) {
          console.error(error);
        }
      });
    } catch (err) {
      console.error(err);
      stop();
    }
  }

  function stop() {
    setScanning(false);
    try {
      readerRef.current?.reset();
    } catch (err) {}
    readerRef.current = null;
  }

  return (
    <div>
      <div className="rounded overflow-hidden border">
        <video ref={videoRef} className="w-full h-64 object-cover" />
      </div>
      <div className="mt-2 flex gap-2">
        {!scanning ? (
          <button onClick={start} className="btn btn-primary">Iniciar escaneo</button>
        ) : (
          <button onClick={stop} className="btn">Detener</button>
        )}
      </div>
    </div>
  );
}
