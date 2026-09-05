"use client";

import { useState, useTransition } from "react";
import {
  Quote,
  Star,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  Sparkles,
  Building2,
  MessageSquareQuote,
  Upload,
  X,
} from "lucide-react";
import type { Testimonial } from "@/lib/db/schema/marketing";
import {
  createTestimonialAction,
  updateTestimonialAction,
  deleteTestimonialAction,
  toggleTestimonialFeaturedAction,
} from "@/actions/admin/testimonials";
import { toast } from "sonner";
import Image from "next/image";
import { UploadButton } from "@/lib/uploadthing/components";

interface TestimonialsManagerProps {
  initialTestimonials: Testimonial[];
}

export function TestimonialsManager({ initialTestimonials }: TestimonialsManagerProps) {
  const [items, setItems] = useState<Testimonial[]>(initialTestimonials);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [quote, setQuote] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [rating, setRating] = useState(5);
  const [isFeatured, setIsFeatured] = useState(true);
  const [sortOrder, setSortOrder] = useState(0);

  const [isPending, startTransition] = useTransition();

  const featuredCount = items.filter((i) => i.isFeatured).length;
  const avgRating =
    items.length > 0
      ? (items.reduce((acc, i) => acc + i.rating, 0) / items.length).toFixed(1)
      : "5.0";

  const openCreateModal = () => {
    setEditingId(null);
    setName("");
    setRole("");
    setCompany("");
    setQuote("");
    setAvatarUrl("");
    setRating(5);
    setIsFeatured(true);
    setSortOrder(items.length);
    setIsModalOpen(true);
  };

  const openEditModal = (item: Testimonial) => {
    setEditingId(item.id);
    setName(item.name);
    setRole(item.role);
    setCompany(item.company);
    setQuote(item.quote);
    setAvatarUrl(item.avatarUrl ?? "");
    setRating(item.rating);
    setIsFeatured(item.isFeatured);
    setSortOrder(item.sortOrder);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !role.trim() || !company.trim() || !quote.trim()) {
      toast.error("Por favor completa los campos obligatorios.");
      return;
    }

    startTransition(async () => {
      try {
        if (editingId) {
          const res = await updateTestimonialAction(editingId, {
            name,
            role,
            company,
            quote,
            avatarUrl: avatarUrl.trim() || undefined,
            rating,
            isFeatured,
            sortOrder,
          });

          if (res.success && res.testimonial) {
            setItems((prev) =>
              prev.map((t) => (t.id === editingId ? res.testimonial! : t))
            );
            toast.success("Testimonio actualizado correctamente.");
            setIsModalOpen(false);
          } else {
            toast.error("No se pudo actualizar el testimonio.");
          }
        } else {
          const res = await createTestimonialAction({
            name,
            role,
            company,
            quote,
            avatarUrl: avatarUrl.trim() || undefined,
            rating,
            isFeatured,
            sortOrder,
          });

          if (res.success && res.testimonial) {
            setItems((prev) => [...prev, res.testimonial!]);
            toast.success("Testimonio creado exitosamente.");
            setIsModalOpen(false);
          } else {
            toast.error(res.error ?? "No se pudo crear el testimonio.");
          }
        }
      } catch {
        toast.error("Ocurrió un error al procesar la solicitud.");
      }
    });
  };

  const handleToggleFeatured = (item: Testimonial) => {
    const nextState = !item.isFeatured;
    setItems((prev) =>
      prev.map((t) => (t.id === item.id ? { ...t, isFeatured: nextState } : t))
    );

    startTransition(async () => {
      try {
        const res = await toggleTestimonialFeaturedAction(item.id, nextState);
        if (res.success) {
          toast.success(
            nextState
              ? "Testimonio destacado en portada."
              : "Testimonio retirado de la portada."
          );
        } else {
          setItems((prev) =>
            prev.map((t) => (t.id === item.id ? { ...t, isFeatured: !nextState } : t))
          );
          toast.error("No se pudo cambiar el estado destacado.");
        }
      } catch {
        setItems((prev) =>
          prev.map((t) => (t.id === item.id ? { ...t, isFeatured: !nextState } : t))
        );
        toast.error("Error al actualizar testimonio.");
      }
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      try {
        const res = await deleteTestimonialAction(id);
        if (res.success) {
          setItems((prev) => prev.filter((t) => t.id !== id));
          toast.success("Testimonio eliminado.");
          setDeleteConfirmId(null);
        } else {
          toast.error("No se pudo eliminar el testimonio.");
        }
      } catch {
        toast.error("Error al eliminar testimonio.");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Testimonios
            </span>
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <MessageSquareQuote className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-3xl font-bold text-foreground">
              {items.length}
            </span>
            <span className="text-xs text-muted-foreground">registrados</span>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Destacados en Portada
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <Sparkles className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-3xl font-bold text-amber-500">
              {featuredCount}
            </span>
            <span className="text-xs text-muted-foreground">visibles en landing</span>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Calificación Promedio
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <Star className="h-5 w-5 fill-amber-500" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-3xl font-bold text-foreground">
              {avgRating}
            </span>
            <span className="text-xs text-muted-foreground">de 5.0 estrellas</span>
          </div>
        </div>
      </div>

      {/* Main Header & Actions */}
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
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Nuevo Testimonio
        </button>
      </div>

      {/* Table Container */}
      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <Quote className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <h3 className="mt-4 font-semibold text-foreground">No hay testimonios registrados</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Comienza agregando la primera historia de éxito para exhibirla en la portada pública.
          </p>
          <button
            type="button"
            onClick={openCreateModal}
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
                        onClick={() => handleToggleFeatured(item)}
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
                          onClick={() => openEditModal(item)}
                          className="p-1.5 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          title="Editar testimonio"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(item.id)}
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

      {/* Modal Crear / Editar */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h3 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
                <Quote className="h-5 w-5 text-primary" />
                {editingId ? "Editar Testimonio" : "Crear Nuevo Testimonio"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-medium"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
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
                    onChange={(e) => setRole(e.target.value)}
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
                    onChange={(e) => setCompany(e.target.value)}
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
                        onClick={() => setAvatarUrl("")}
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
                            setAvatarUrl(url);
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
                  onChange={(e) => setQuote(e.target.value)}
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
                        onClick={() => setRating(s)}
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
                    onChange={(e) => setSortOrder(Number(e.target.value))}
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
                      onChange={(e) => setIsFeatured(e.target.checked)}
                      className="h-4 w-4 rounded text-primary focus:ring-primary"
                    />
                    <span className="font-medium text-foreground">Destacar en Landing</span>
                  </label>
                </div>
              </div>

              {/* Vista Previa en Vivo */}
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
                  onClick={() => setIsModalOpen(false)}
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
        </div>
      )}

      {/* Modal Confirmar Eliminación */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl">
            <h4 className="font-semibold text-foreground">¿Eliminar este testimonio?</h4>
            <p className="mt-2 text-xs text-muted-foreground">
              Esta acción retirará permanentemente la historia de éxito de la plataforma y de la página principal.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="rounded-xl border border-border px-3.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirmId)}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
