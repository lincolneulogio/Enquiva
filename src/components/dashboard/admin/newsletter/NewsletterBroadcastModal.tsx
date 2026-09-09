"use client";

import React from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { Send, Sparkles, ImagePlus, X as XIcon, Loader2 } from "lucide-react";
import { UploadButton } from "@/lib/cloudinary/components";
import { toast } from "sonner";
import type { NewsletterStats } from "@/actions/admin/newsletter";

interface NewsletterBroadcastModalProps {
  isOpen: boolean;
  portalTarget: HTMLElement | null;
  stats: NewsletterStats;
  isPending: boolean;
  broadcastSubject: string;
  setBroadcastSubject: (val: string) => void;
  broadcastMessage: string;
  setBroadcastMessage: (val: string) => void;
  broadcastImageUrl: string | null;
  setBroadcastImageUrl: (val: string | null) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function NewsletterBroadcastModal({
  isOpen,
  portalTarget,
  stats,
  isPending,
  broadcastSubject,
  setBroadcastSubject,
  broadcastMessage,
  setBroadcastMessage,
  broadcastImageUrl,
  setBroadcastImageUrl,
  onClose,
  onSubmit,
}: NewsletterBroadcastModalProps) {
  if (!portalTarget || !isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-xl rounded-2xl border border-border bg-card shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 shrink-0">
          <h3 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            Comunicado a Suscriptores del Boletín
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto px-6 py-5">
          <form id="broadcast-form" onSubmit={onSubmit} className="space-y-4">
            {/* Info banner */}
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-3.5 flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-primary shrink-0" />
              <p className="text-xs text-foreground">
                Este mensaje se enviará directamente por correo a los{" "}
                <strong>{stats.active} suscriptores activos</strong> registrados a través de la portada.
              </p>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                Asunto del Correo *
              </label>
              <input
                type="text"
                required
                value={broadcastSubject}
                onChange={(e) => setBroadcastSubject(e.target.value)}
                placeholder="Ej. Nuevos eventos disponibles en Enquiva este mes"
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Message */}
            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                Contenido del Mensaje *
              </label>
              <textarea
                required
                rows={5}
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                placeholder="Escribe el mensaje o anuncio para los miembros de la comunidad..."
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed resize-none"
              />
            </div>

            {/* Image upload */}
            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                Imagen del Comunicado{" "}
                <span className="normal-case text-muted-foreground font-normal">(opcional)</span>
              </label>

              {broadcastImageUrl ? (
                <div className="relative rounded-xl overflow-hidden border border-border bg-muted/20">
                  <div className="relative w-full aspect-video">
                    <Image
                      src={broadcastImageUrl}
                      alt="Vista previa de imagen"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setBroadcastImageUrl(null)}
                    className="absolute top-2 right-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80 transition-colors"
                    title="Quitar imagen"
                  >
                    <XIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/10 px-4 py-5 hover:border-primary/50 transition-colors">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <ImagePlus className="h-7 w-7 text-muted-foreground/50" />
                    <p className="text-xs text-muted-foreground">
                      Sube una imagen para acompañar el mensaje <br />
                      <span className="text-[11px]">JPG, PNG, WEBP &mdash; Máx. 4 MB</span>
                    </p>
                    <UploadButton
                      endpoint="newsletterImage"
                      appearance={{
                        button:
                          "ut-ready:bg-primary ut-ready:text-primary-foreground ut-uploading:bg-primary/70 text-xs font-medium px-3 py-1.5 rounded-lg h-auto after:bg-primary/80",
                        allowedContent: "hidden",
                      }}
                      content={{ button: "Seleccionar imagen" }}
                      onClientUploadComplete={(res: { url: string }[]) => {
                        const url = res[0]?.url;
                        if (url) setBroadcastImageUrl(url);
                      }}
                      onUploadError={(err: Error) => {
                        toast.error(`Error al subir imagen: ${err.message}`);
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="broadcast-form"
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Enviar a {stats.active} suscriptores
          </button>
        </div>
      </div>
    </div>,
    portalTarget
  );
}
