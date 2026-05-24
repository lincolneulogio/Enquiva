"use client";

import { useState } from "react";
import { FileText, History, X, Copy, ExternalLink, Image as ImageIcon, ClipboardList } from "lucide-react";
import { toast } from "sonner";

interface PaymentNotesButtonProps {
  notes: string;
  eventName: string;
  attendeeName?: string;
  amountFormatted: string;
  receiptUrl?: string | null;
  receiptFileName?: string | null;
}

export function PaymentNotesButton({
  notes,
  eventName,
  attendeeName,
  amountFormatted,
  receiptUrl,
  receiptFileName,
}: PaymentNotesButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isHistory = notes.includes("Historial de Comprobante");

  // Helper to extract URLs from text to make clickable links
  const renderFormattedNotes = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    
    return text.split("\n").map((line, idx) => {
      if (urlRegex.test(line)) {
        const parts = line.split(urlRegex);
        return (
          <p key={idx} className="min-h-[1.5em] break-all leading-relaxed py-1 border-b border-border/10 last:border-0">
            {parts.map((part, pIdx) => {
              if (urlRegex.test(part)) {
                return (
                  <span key={pIdx} className="inline-flex flex-wrap items-center gap-2 mt-1">
                    <a
                      href={part}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline font-semibold break-all inline-flex items-center gap-1 bg-primary/5 px-2.5 py-0.5 rounded-lg border border-primary/15"
                    >
                      [Ver Imagen Anterior]
                      <ExternalLink className="h-3 w-3 inline" />
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(part);
                        toast.success("¡Enlace copiado!");
                      }}
                      className="text-[10px] bg-muted hover:bg-muted/80 px-2 py-0.5 rounded-lg border text-muted-foreground active:scale-95 transition-all inline-flex items-center gap-1 shrink-0"
                    >
                      <Copy className="h-2.5 w-2.5" />
                      Copiar Enlace
                    </button>
                  </span>
                );
              }
              return part;
            })}
          </p>
        );
      }
      return <p key={idx} className="min-h-[1.5em] leading-relaxed">{line}</p>;
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all mt-1 active:scale-95 cursor-pointer ${
          isHistory
            ? "bg-amber-500/10 text-amber-700 border-amber-500/20 hover:bg-amber-500/20 dark:text-amber-400"
            : "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
        }`}
      >
        {isHistory ? (
          <>
            <History className="h-3 w-3 shrink-0" />
            Ver Historial
          </>
        ) : (
          <>
            <FileText className="h-3 w-3 shrink-0" />
            Ver Notas
          </>
        )}
      </button>

      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setIsOpen(false)}
        >
          <div 
            className="relative w-full max-w-lg fe-glass rounded-3xl bg-card border border-border shadow-2xl p-6 flex flex-col max-h-[85vh] animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-border/80">
              <div>
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  {isHistory ? (
                    <History className="h-5 w-5 text-amber-500 shrink-0" />
                  ) : (
                    <FileText className="h-5 w-5 text-primary shrink-0" />
                  )}
                  {isHistory ? "Historial de Pago y Comprobantes" : "Notas del Pago"}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {eventName} · <span className="font-semibold text-foreground">{amountFormatted}</span>
                </p>
                {attendeeName && (
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Participante: <span className="font-medium text-foreground">{attendeeName}</span>
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 rounded-full hover:bg-muted active:scale-95 transition-all flex items-center justify-center border text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto py-4 text-sm text-foreground space-y-5 scrollbar-thin max-h-[55vh] pr-2">
              
              {/* Comprobante de Pago Actual */}
              {receiptUrl && (
                <div className="space-y-2 border-b border-border/50 pb-4">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <ImageIcon className="h-3.5 w-3.5 text-primary shrink-0" />
                    Comprobante de Pago Actual
                  </h4>
                  <div className="relative rounded-2xl overflow-hidden border border-border bg-muted/10 flex items-center justify-center p-2.5 group max-w-full">
                    <img
                      src={receiptUrl}
                      alt="Comprobante de pago actual"
                      className="max-h-[200px] rounded-xl object-contain w-auto hover:scale-[1.01] transition-transform duration-300 shadow-sm"
                    />
                    <div className="absolute top-2.5 right-2.5 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <a
                        href={receiptUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-black/75 hover:bg-black text-white p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors border border-white/10"
                        title="Abrir en pantalla completa"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                  {receiptFileName && (
                    <p className="text-[10px] text-muted-foreground truncate text-center font-mono">
                      Archivo: {receiptFileName}
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <ClipboardList className="h-3.5 w-3.5 text-primary shrink-0" />
                  Detalle e Historial
                </h4>
                <div className="bg-muted/40 p-4 rounded-2xl border border-border/60 text-xs text-muted-foreground font-mono whitespace-pre-wrap leading-relaxed select-text">
                  {renderFormattedNotes(notes)}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-border/80 flex justify-end">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="fe-btn-glow px-5 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-semibold active:scale-95 transition-all shadow-sm cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
