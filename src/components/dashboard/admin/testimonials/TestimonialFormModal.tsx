import { createPortal } from "react-dom";
import Image from "next/image";
import { Quote, Star, Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { UploadButton } from "@/lib/uploadthing/components";
import type { TestimonialFormData } from "./types";

interface TestimonialFormModalProps {
  portalTarget: HTMLElement | null;
  isOpen: boolean;
  editingId: string | null;
  isPending: boolean;
  formData: TestimonialFormData;
  onFormChange: <K extends keyof TestimonialFormData>(field: K, value: TestimonialFormData[K]) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export function TestimonialFormModal({
  portalTarget,
  isOpen,
  editingId,
  isPending,
  formData,
  onFormChange,
  onSubmit,
  onClose,
}: TestimonialFormModalProps) {
  if (!portalTarget || !isOpen) return null;

  const {
    name,
    role,
    company,
    quote,
    avatarUrl,
    rating,
    isFeatured,
    sortOrder,
  } = formData;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <h3 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
            <Quote className="h-5 w-5 text-primary" />
            {editingId ? "Editar Testimonio" : "Crear Nuevo Testimonio"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-sm font-medium"
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                Nombre Completo *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => onFormChange("name", e.target.value)}
                placeholder="Ej. Sofía Benavides"
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                Cargo / Rol *
              </label>
              <input
                type="text"
                required
                value={role}
                onChange={(e) => onFormChange("role", e.target.value)}
                placeholder="Ej. Directora de Operaciones"
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                Empresa u Organización *
              </label>
              <input
                type="text"
                required
                value={company}
                onChange={(e) => onFormChange("company", e.target.value)}
                placeholder="Ej. InnovaTech Latam"
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                Foto / Avatar
              </label>
              {avatarUrl ? (
                <div className="relative flex items-center gap-3 rounded-xl border border-border bg-muted/30 px-3 py-2">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-border">
                    <Image
                      src={avatarUrl}
                      alt="Avatar preview"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">Imagen cargada</p>
                    <p className="text-[11px] text-muted-foreground truncate">{avatarUrl.split("/").pop()}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onFormChange("avatarUrl", "")}
                    className="shrink-0 rounded-lg p-1 text-muted-foreground hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-950/30 transition-colors"
                    title="Quitar imagen"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="rounded-xl border-2 border-dashed border-border bg-muted/20 overflow-hidden">
                  <UploadButton
                    endpoint="testimonialAvatar"
                    onClientUploadComplete={(res) => {
                      const url = res?.[0]?.url;
                      if (url) {
                        onFormChange("avatarUrl", url);
                        toast.success("Imagen subida correctamente.");
                      }
                    }}
                    onUploadError={(err) => {
                      toast.error(`Error al subir imagen: ${err.message}`);
                    }}
                    appearance={{
                      button:
                        "w-full bg-primary text-primary-foreground text-xs font-medium py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors ut-uploading:cursor-not-allowed ut-uploading:opacity-60 focus-within:ring-2 focus-within:ring-primary",
                      allowedContent: "text-[10px] text-muted-foreground mt-0.5",
                      container: "flex flex-col items-center gap-2 py-3 px-2",
                    }}
                    content={{
                      button: (
                        <span className="inline-flex items-center gap-1.5">
                          <Upload className="h-3.5 w-3.5" />
                          Subir foto
                        </span>
                      ),
                      allowedContent: "PNG, JPG, WEBP · máx. 2MB",
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
              Testimonio / Cita *
            </label>
            <textarea
              required
              rows={4}
              value={quote}
              onChange={(e) => onFormChange("quote", e.target.value)}
              placeholder="Escribe el testimonio o reseña de la experiencia con Enquiva..."
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-border pt-4">
            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                Calificación
              </label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => onFormChange("rating", s)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`h-5 w-5 ${
                        s <= rating
                          ? "fill-amber-500 text-amber-500"
                          : "text-muted-foreground/40"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                Orden de Visualización
              </label>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => onFormChange("sortOrder", Number(e.target.value))}
                className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                Visibilidad en Portada
              </label>
              <label className="mt-1 flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => onFormChange("isFeatured", e.target.checked)}
                  className="h-4 w-4 rounded text-primary focus:ring-primary"
                />
                <span className="font-medium text-foreground">Destacar en Landing</span>
              </label>
            </div>
          </div>

          {/* Live Preview */}
          <div className="border-t border-border pt-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Vista Previa en Portada
            </p>
            <div className="rounded-2xl border border-border/80 bg-muted/20 p-5">
              <div className="flex items-center gap-1 mb-3 text-amber-500">
                {Array.from({ length: rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-500 text-amber-500" />
                ))}
              </div>
              <p className="text-sm italic text-foreground/90 leading-relaxed mb-4">
                &ldquo;{quote || "El testimonio aparecerá aquí con este estilo..."}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="relative h-9 w-9 overflow-hidden rounded-full bg-primary/10 border border-border">
                  {avatarUrl ? (
                    <Image src={avatarUrl} alt="Preview" fill className="object-cover" unoptimized />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center font-bold text-xs text-primary">
                      {name ? name.charAt(0) : "A"}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">{name || "Nombre del Autor"}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {role || "Cargo"} • {company || "Empresa"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingId ? "Guardar Cambios" : "Crear Testimonio"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    portalTarget
  );
}
