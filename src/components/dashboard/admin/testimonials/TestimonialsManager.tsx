"use client";

import type { TestimonialsManagerProps } from "./types";
import { TestimonialsStatsHeader } from "./TestimonialsStatsHeader";
import { TestimonialsTable } from "./TestimonialsTable";
import { TestimonialFormModal } from "./TestimonialFormModal";
import { DeleteConfirmModal } from "./DeleteConfirmModal";
import { useTestimonialsManager } from "./useTestimonialsManager";

export type { TestimonialsManagerProps };

export function TestimonialsManager({ initialTestimonials }: TestimonialsManagerProps) {
  const {
    items,
    featuredCount,
    avgRating,
    isModalOpen,
    editingId,
    deleteConfirmId,
    setDeleteConfirmId,
    portalTarget,
    formData,
    isPending,
    updateFormField,
    openCreateModal,
    openEditModal,
    closeModal,
    handleSubmit,
    handleToggleFeatured,
    handleDelete,
  } = useTestimonialsManager(initialTestimonials);

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
