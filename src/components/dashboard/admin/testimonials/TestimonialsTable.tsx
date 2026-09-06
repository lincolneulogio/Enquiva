import Image from "next/image";
import { Quote, Star, Plus, Edit2, Trash2, Building2 } from "lucide-react";
import type { Testimonial } from "@/lib/db/schema/marketing";

interface TestimonialsTableProps {
  items: Testimonial[];
  isPending: boolean;
  onOpenCreate: () => void;
  onOpenEdit: (item: Testimonial) => void;
  onToggleFeatured: (item: Testimonial) => void;
  onConfirmDelete: (id: string) => void;
}

export function TestimonialsTable({
  items,
  isPending,
  onOpenCreate,
  onOpenEdit,
  onToggleFeatured,
  onConfirmDelete,
}: TestimonialsTableProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-semibold text-foreground">
            Directorio de Historias de Éxito
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Administra los testimonios de clientes, organizadores y asistentes mostrados en la página de inicio.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenCreate}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Nuevo Testimonio
        </button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <Quote className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <h3 className="mt-4 font-semibold text-foreground">No hay testimonios registrados</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Comienza agregando la primera historia de éxito para exhibirla en la portada pública.
          </p>
          <button
            type="button"
            onClick={onOpenCreate}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Crear Testimonio
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="border-b border-border bg-muted/40 text-muted-foreground font-medium">
                <tr>
                  <th className="px-4 py-3.5">Autor & Cargo</th>
                  <th className="px-4 py-3.5">Empresa</th>
                  <th className="px-4 py-3.5">Testimonio</th>
                  <th className="px-4 py-3.5 text-center">Calificación</th>
                  <th className="px-4 py-3.5 text-center">Orden</th>
                  <th className="px-4 py-3.5 text-center">Portada</th>
                  <th className="px-4 py-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
                          {item.avatarUrl ? (
                            <Image
                              src={item.avatarUrl}
                              alt={item.name}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center font-semibold text-muted-foreground">
                              {item.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground font-medium">
                      <span className="inline-flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground/70" />
                        {item.company}
                      </span>
                    </td>
                    <td className="px-4 py-4 max-w-xs">
                      <p className="line-clamp-2 text-xs text-muted-foreground italic">
                        &ldquo;{item.quote}&rdquo;
                      </p>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="inline-flex items-center gap-0.5 text-amber-500">
                        {Array.from({ length: item.rating }).map((_, i) => (
                          <Star key={i} className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center text-muted-foreground font-mono">
                      #{item.sortOrder}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button
                        type="button"
                        onClick={() => onToggleFeatured(item)}
                        disabled={isPending}
                        title={item.isFeatured ? "Destacado (clic para ocultar)" : "Clic para destacar en portada"}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                          item.isFeatured
                            ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-400/40 hover:bg-amber-500/25"
                            : "bg-muted text-muted-foreground border border-border/60 hover:bg-muted/80"
                        }`}
                      >
                        <Star
                          className={`h-3 w-3 ${
                            item.isFeatured ? "fill-amber-500 text-amber-500" : "text-muted-foreground"
                          }`}
                        />
                        {item.isFeatured ? "Visible" : "Oculto"}
                      </button>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onOpenEdit(item)}
                          className="p-1.5 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          title="Editar testimonio"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onConfirmDelete(item.id)}
                          className="p-1.5 rounded-lg border border-red-200/50 bg-card text-red-600 hover:bg-red-50 dark:border-red-900/40 dark:text-red-400 dark:hover:bg-red-950/20 transition-colors"
                          title="Eliminar testimonio"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
