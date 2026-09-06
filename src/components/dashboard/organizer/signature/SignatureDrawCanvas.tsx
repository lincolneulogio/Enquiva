"use client";

import { useRef, useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";

interface SignatureDrawCanvasProps {
  setSignatureUrl: (url: string | null) => void;
  locale: "es" | "en";
}

export function SignatureDrawCanvas({
  setSignatureUrl,
  locale,
}: SignatureDrawCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.strokeStyle = "#0f172a"; // slate-900 deep ink
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
      }
    }
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsDrawing(true);

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL("image/png");
      setSignatureUrl(dataUrl);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    setSignatureUrl(null);
  };

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-border bg-white p-2 shadow-inner flex flex-col items-center">
        <canvas
          ref={canvasRef}
          width={420}
          height={140}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full max-w-[420px] h-[140px] border border-dashed border-slate-200 rounded-xl bg-white touch-none cursor-crosshair"
        />
        <p className="text-[10px] text-slate-400 mt-2">
          {locale === "en"
            ? "Draw your signature above using your mouse, stylus or finger."
            : "Traza tu firma aquí usando el mouse, lápiz táctil o dedo."}
        </p>
      </div>
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={clearCanvas}
          className="rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition flex items-center gap-1.5 cursor-pointer"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>{locale === "en" ? "Clear" : "Limpiar trazo"}</span>
        </button>
      </div>
    </div>
  );
}
