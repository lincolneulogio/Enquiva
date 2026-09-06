import { createPortal } from "react-dom";
import { Quote, Star, Loader2 } from "lucide-react";
import type { TestimonialFormData } from "./types";
import { TestimonialAvatarField } from "./TestimonialAvatarField";

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

  const { name, role, company, quote, avatarUrl, rating, isFeatured, sortOrder } = formData;

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
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground text-sm font-medium">
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">Nombre Completo *</label>
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
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">Cargo / Rol *</label>
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
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">Empresa u Organización *</label>
              <input
                type="text"
                required
                value={company}
                onChange={(e) => onFormChange("company", e.target.value)}
                placeholder="Ej. InnovaTech Latam"
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <TestimonialAvatarField avatarUrl={avatarUrl} onAvatarChange={(url) => onFormChange("avatarUrl", url)} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">Testimonio / Cita *</label>
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
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">Calificación</label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} type="button" onClick={() => onFormChange("rating", s)} className="p-1 text-muted-foreground hover:text-amber-500 transition-colors">
                    <Star className={`h-5 w-5 ${s <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">Orden</label>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => onFormChange("sortOrder", parseInt(e.target.value) || 0)}
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex flex-col justify-end">
              <label className="relative flex items-center gap-2.5 cursor-pointer select-none py-2">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => onFormChange("isFeatured", e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-xs font-semibold text-foreground">Destacado en Portada</span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
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
