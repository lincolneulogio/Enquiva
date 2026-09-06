"use client";

import { useState, useTransition, useEffect } from "react";
import type { Testimonial } from "@/lib/db/schema/marketing";
import {
  createTestimonialAction,
  updateTestimonialAction,
  deleteTestimonialAction,
  toggleTestimonialFeaturedAction,
} from "@/actions/admin/testimonials";
import { toast } from "sonner";
import { deleteOrphanUploadAction } from "@/actions/admin/upload-cleanup";
import {
  type TestimonialsManagerProps,
  type TestimonialFormData,
  TestimonialsStatsHeader,
  TestimonialsTable,
  TestimonialFormModal,
  DeleteConfirmModal,
} from "./testimonials";

export type { TestimonialsManagerProps };

const DEFAULT_FORM_DATA: TestimonialFormData = {
  name: "",
  role: "",
  company: "",
  quote: "",
  avatarUrl: "",
  originalAvatarUrl: "",
  rating: 5,
  isFeatured: true,
  sortOrder: 0,
};

export function TestimonialsManager({ initialTestimonials }: TestimonialsManagerProps) {
  const [items, setItems] = useState<Testimonial[]>(initialTestimonials);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [formData, setFormData] = useState<TestimonialFormData>(DEFAULT_FORM_DATA);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setPortalTarget(document.body);
  }, []);

  useEffect(() => {
    const isAnyModalOpen = isModalOpen || Boolean(deleteConfirmId);
    if (!isAnyModalOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (deleteConfirmId) {
          setDeleteConfirmId(null);
        } else if (isModalOpen) {
          closeModal();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isModalOpen, deleteConfirmId]);

  const featuredCount = items.filter((i) => i.isFeatured).length;
  const avgRating =
    items.length > 0
      ? (items.reduce((acc, i) => acc + i.rating, 0) / items.length).toFixed(1)
      : "5.0";

  const updateFormField = <K extends keyof TestimonialFormData>(
    field: K,
    value: TestimonialFormData[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({
      ...DEFAULT_FORM_DATA,
      sortOrder: items.length,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: Testimonial) => {
    setEditingId(item.id);
    setFormData({
      name: item.name,
      role: item.role,
      company: item.company,
      quote: item.quote,
      avatarUrl: item.avatarUrl ?? "",
      originalAvatarUrl: item.avatarUrl ?? "",
      rating: item.rating,
      isFeatured: item.isFeatured,
      sortOrder: item.sortOrder,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    const urlToCheck = formData.avatarUrl;
    const isOrphan =
      (!editingId && !!urlToCheck) ||
      (!!editingId && !!urlToCheck && urlToCheck !== formData.originalAvatarUrl);

    if (isOrphan) {
      deleteOrphanUploadAction(urlToCheck).catch(() => {});
    }

    setIsModalOpen(false);
    setEditingId(null);
    setFormData(DEFAULT_FORM_DATA);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { name, role, company, quote, avatarUrl, rating, isFeatured, sortOrder } = formData;
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
      <TestimonialsStatsHeader
        totalCount={items.length}
        featuredCount={featuredCount}
        avgRating={avgRating}
      />

      <TestimonialsTable
        items={items}
        isPending={isPending}
        onOpenCreate={openCreateModal}
        onOpenEdit={openEditModal}
        onToggleFeatured={handleToggleFeatured}
        onConfirmDelete={(id) => setDeleteConfirmId(id)}
      />

      <TestimonialFormModal
        portalTarget={portalTarget}
        isOpen={isModalOpen}
        editingId={editingId}
        isPending={isPending}
        formData={formData}
        onFormChange={updateFormField}
        onSubmit={handleSubmit}
        onClose={closeModal}
      />

      <DeleteConfirmModal
        portalTarget={portalTarget}
        deleteConfirmId={deleteConfirmId}
        isPending={isPending}
        onClose={() => setDeleteConfirmId(null)}
        onConfirmDelete={handleDelete}
      />
    </div>
  );
}
