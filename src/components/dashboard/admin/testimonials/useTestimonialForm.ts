"use client";

import { useState } from "react";
import type { Testimonial } from "@/lib/db/schema/marketing";
import {
  createTestimonialAction,
  updateTestimonialAction,
} from "@/actions/admin/testimonials";
import { toast } from "sonner";
import { useTranslations } from "@/components/providers/LocaleProvider";
import { deleteOrphanUploadAction } from "@/actions/admin/upload-cleanup";
import type { TestimonialFormData } from "./types";

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

export function useTestimonialForm(
  items: Testimonial[],
  setItems: React.Dispatch<React.SetStateAction<Testimonial[]>>,
  startTransition: (cb: () => Promise<void>) => void,
) {
  const t = useTranslations();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<TestimonialFormData>(DEFAULT_FORM_DATA);

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
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { name, role, company, quote, avatarUrl, rating, isFeatured, sortOrder } = formData;
    if (!name.trim() || !role.trim() || !company.trim() || !quote.trim()) {
      toast.error(t("dashboard.admin.testimonialRequiredFields"));
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
            toast.success(t("dashboard.admin.testimonialUpdated"));
            setIsModalOpen(false);
          } else {
            toast.error(t("dashboard.admin.testimonialUpdateError"));
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
            toast.success(t("dashboard.admin.testimonialCreated"));
            setIsModalOpen(false);
          } else {
            toast.error(res.error ?? t("dashboard.admin.testimonialCreateError"));
          }
        }
      } catch {
        toast.error(t("dashboard.admin.testimonialRequestError"));
      }
    });
  };

  return {
    isModalOpen,
    editingId,
    formData,
    updateFormField,
    openCreateModal,
    openEditModal,
    closeModal,
    handleSubmit,
  };
}
